import { mock, anyObject, anyFunction } from "jest-mock-extended";
import type { ActorRefFrom, AnyEventObject, Behavior } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { createPublishAction, withPubSub } from "./pub_sub";

type AnyBehavior = Behavior<AnyEventObject, unknown>;
type AnyActorRef = ActorRefFrom<AnyBehavior>;

describe(withPubSub, () => {
	it("should pass received events to the given behavior", () => {
		const behavior = mock<AnyBehavior>({ initialState: "initial" });
		const toBeSend = { type: "test_event" };

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(toBeSend);

		expect(behavior.transition).toBeCalledTimes(1);
		expect(behavior.transition).toBeCalledWith(
			"initial",
			toBeSend,
			anyObject()
		);
	});

	it("should not pass subscribe events to the given behavior", () => {
		const behavior = mock<AnyBehavior>();
		const subscriber = mock<AnyActorRef>();

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(subscribe(subscriber));

		expect(behavior.transition).not.toBeCalled();
	});

	it("should not pass unsubscribe events to the given behavior", () => {
		const behavior = mock<AnyBehavior>();
		const subscriber = mock<AnyActorRef>();

		const actor = spawnBehavior(withPubSub(() => behavior));
		actor.send(unsubscribe(subscriber));

		expect(behavior.transition).not.toBeCalled();
	});

	describe("publish", () => {
		type PubEvent = { type: "test.first" } | { type: "test.second" };

		const publisher = withPubSub<PubEvent, AnyEventObject, null>((publish) => ({
			initialState: null,
			transition: (state) => {
				publish({ type: "test.first" });
				return state;
			},
		}));

		it("should publish events to a subscriber", () => {
			const subscriber = mock<AnyActorRef>();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber));
			actor.send("publish"); // Transition the actor to publish an event

			expect(subscriber.send).toBeCalledTimes(1);
			expect(subscriber.send).toBeCalledWith({ type: "test.first" });
		});

		it("should not publish events to a subscriber if it unsubscribed", () => {
			const subscriber = mock<AnyActorRef>();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber));
			actor.send(unsubscribe(subscriber));
			actor.send("publish");

			expect(subscriber.send).not.toBeCalled();
		});

		it("should not publish an event to uninterested subscribers", () => {
			const subscriber = mock<AnyActorRef>();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber, ["test.second"]));
			actor.send("publish");

			expect(subscriber.send).not.toBeCalled();
		});

		it("should publish an event to multiple subscribers", () => {
			const subscriber1 = mock<AnyActorRef>();
			const subscriber2 = mock<AnyActorRef>();
			const actor = spawnBehavior(publisher);

			actor.send(subscribe(subscriber1));
			actor.send(subscribe(subscriber2));
			actor.send("publish");

			expect(subscriber1.send).toBeCalledTimes(1);
			expect(subscriber2.send).toBeCalledTimes(1);
		});
	});
});

describe(createPublishAction, () => {
	it("should return a function that is named 'publish'", () => {
		// Expecting that the function is named ensures a nice call stack
		const publish = jest.fn();

		const publishAction = createPublishAction(publish);

		expect(publishAction.name).toBe("publishAction");
	});

	it("should return an action creator", () => {
		const publish = jest.fn();
		const publishAction = createPublishAction(publish);

		const action = publishAction({ type: "test" });

		expect(action).toStrictEqual({ type: "publish", exec: anyFunction() });
	});

	it("should call publish when the action is executed", () => {
		const publish = jest.fn();
		const publishAction = createPublishAction(publish);

		const action = publishAction({ type: "test" });
		// @ts-expect-error We don't care about the arguments
		action.exec?.();

		expect(publish).toBeCalledTimes(1);
		expect(publish).toBeCalledWith({ type: "test" });
	});
});
