import { AnyEventObject, Event } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { FromEventTypes } from "../utils/types";
import { withPubSub } from "./pub_sub";

function createMockSubscriber(): [typeof handler, typeof subscriber] {
	const handler = jest.fn<void, [Event<AnyEventObject>]>();
	const subscriber = { send: handler };

	return [handler, subscriber];
}

function createMockBehavior(): [typeof handler, typeof behavior] {
	const handler = jest.fn();
	const behavior = withPubSub(() => ({
		initialState: null,
		transition: handler,
	}));

	return [handler, behavior];
}

describe(withPubSub, () => {
	it("should pass received events to the given behavior", () => {
		const [handler, behavior] = createMockBehavior();
		const toBeSend = { type: "test_event" };

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(toBeSend);

		expect(handler).toBeCalledTimes(1);
		expect(handler).toBeCalledWith(null, toBeSend, expect.anything());
	});

	it("should not pass subscribe events to the given behavior", () => {
		const [handler, behavior] = createMockBehavior();
		const [, sub] = createMockSubscriber();

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(subscribe(sub));

		expect(handler).not.toBeCalled();
	});

	it("should not pass unsubscribe events to the given behavior", () => {
		const [handler, behavior] = createMockBehavior();
		const [, sub] = createMockSubscriber();

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(unsubscribe(sub));

		expect(handler).not.toBeCalled();
	});

	describe("publish", () => {
		type PubEvent = FromEventTypes<"test.first" | "test.second">;

		const publisher = withPubSub<PubEvent, AnyEventObject, null>((publish) => ({
			initialState: null,
			transition: (state) => {
				publish({ type: "test.first" });
				return state;
			},
		}));

		it("should publish events to a subscriber", () => {
			const [handler, subscriber] = createMockSubscriber();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber));
			actor.send("publish"); // Transition the actor to publish an event

			expect(handler).toBeCalledTimes(1);
			expect(handler).toBeCalledWith({ type: "test.first" });
		});

		it("should not publish events to a subscriber if it unsubscribed", () => {
			const [handler, subscriber] = createMockSubscriber();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber));
			actor.send(unsubscribe(subscriber));
			actor.send("publish");

			expect(handler).not.toBeCalled();
		});

		it("should not publish an event to uninterested subscribers", () => {
			const [handler, subscriber] = createMockSubscriber();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber, ["test.second"]));
			actor.send("publish");

			expect(handler).not.toBeCalled();
		});

		it("should publish an event to multiple subscribers", () => {
			const [handler1, subscriber1] = createMockSubscriber();
			const [handler2, subscriber2] = createMockSubscriber();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber1));
			actor.send(subscribe(subscriber2));
			actor.send("publish");

			expect(handler1).toBeCalledTimes(1);
			expect(handler2).toBeCalledTimes(1);
		});
	});
});