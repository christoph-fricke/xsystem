import { mock } from "jest-mock-extended";
import type { ActorRef, AnyEventObject } from "xstate";
import { createMachine, interpret, send } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { withPubSub } from "../messaging/mod";
import { fromActor } from "./from_actor";

type AnyActorRef = ActorRef<AnyEventObject, unknown>;

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
		const publisher = mock<AnyActorRef>();

		const actor = interpret(
			createPingMachine().withConfig({
				services: { pub: fromActor(publisher, ["test_event"]) },
			})
		);
		actor.start();

		expect(publisher.send).toBeCalledTimes(1);
		expect(publisher.send).toBeCalledWith(
			subscribe(expect.anything(), ["test_event"])
		);

		actor.stop();
	});

	it("should unsubscribe a machine from a given actor when the service is stopped", () => {
		const publisher = mock<AnyActorRef>();

		const actor = interpret(
			createPingMachine().withConfig({
				services: { pub: fromActor(publisher, ["test_event"]) },
			})
		);

		actor.start();
		actor.stop();

		expect(publisher.send).toBeCalledTimes(2);
		expect(publisher.send).toBeCalledWith(unsubscribe(expect.anything()));
	});

	it("should be able to resolve the actor from a passed function", () => {
		const publisher = mock<AnyActorRef>();
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
		const publisher = mock<AnyActorRef>();

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

		expect(publisher.send).toBeCalledWith({ type: "test1" });
		expect(publisher.send).toBeCalledWith({ type: "test2" });

		actor.stop();
	});
});
