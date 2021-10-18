import { createMachine, interpret, send } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { withPubSub } from "../messaging/mod";
import { createMockActor } from "../testing/create_mock";
import { fromActor } from "./from_actor";

type Event = { type: "ping" } | { type: "pong" };
type Context = Record<string, unknown>;

function createPingMachine() {
	return createMachine<Context, Event>({
		id: "ping",
		initial: "ping",
		invoke: { src: "pub" },
		states: {
			ping: { on: { ping: "pong" } },
			pong: { on: { pong: "ping" } },
		},
	});
}

describe(fromActor, () => {
	it("should subscribe a machine to events published by the given actor", () => {
		const [handler, publisher] = createMockActor();

		const actor = interpret(
			createPingMachine().withConfig({
				services: { pub: fromActor(publisher, ["test_event"]) },
			})
		);
		actor.start();

		expect(handler).toBeCalledTimes(1);
		expect(handler).toBeCalledWith(
			subscribe(expect.anything(), ["test_event"])
		);

		actor.stop();
	});

	it("should unsubscribe a machine from a given actor when the service is stopped", () => {
		const [handler, publisher] = createMockActor();

		const actor = interpret(
			createPingMachine().withConfig({
				services: { pub: fromActor(publisher, ["test_event"]) },
			})
		);

		actor.start();
		actor.stop();

		expect(handler).toBeCalledTimes(2);
		expect(handler).toBeCalledWith(unsubscribe(expect.anything()));
	});

	it("should be able to resolve the actor from a passed function", () => {
		const [, publisher] = createMockActor();
		const getPublisher = jest.fn().mockReturnValue(publisher);
		const context = { key: "test" };
		const actor = interpret(
			createPingMachine()
				.withConfig({
					services: { pub: fromActor(getPublisher, ["test_event"]) },
				})
				.withContext(context)
		);

		actor.start();

		expect(getPublisher).toBeCalledTimes(1);
		// The context and event that caused the invocation should be provided to the resolver function
		expect(getPublisher).toBeCalledWith(context, { type: "xstate.init" });

		actor.stop();
	});

	it("should send events published by the actor to the machine", () => {
		const publishBehavior = withPubSub((publish) => ({
			initialState: null,
			transition: (state) => {
				publish({ type: "ping" });
				return state;
			},
		}));
		const publisher = spawnBehavior(publishBehavior);
		const actor = interpret(
			createPingMachine().withConfig({
				services: { pub: fromActor(publisher, ["ping"]) },
			})
		);

		actor.start();
		publisher.send("transition");

		expect(actor.getSnapshot().value).toBe("pong");

		actor.stop();
	});

	it("should send events that are send to the created service to the actor", () => {
		const [handler, publisher] = createMockActor();

		const actor = interpret(
			createMachine<Context, Event>({
				id: "ping",
				initial: "ping",
				invoke: { src: "pub" },
				states: {
					ping: {
						on: { ping: "pong" },
						entry: [send("test1", { to: "pub" }), send("test2", { to: "pub" })],
					},
					pong: { on: { pong: "ping" } },
				},
			}).withConfig({
				services: { pub: fromActor(publisher, ["test_event"]) },
			})
		);

		actor.start();

		expect(handler).toBeCalledWith({ type: "test1" });
		expect(handler).toBeCalledWith({ type: "test2" });

		actor.stop();
	});
});
