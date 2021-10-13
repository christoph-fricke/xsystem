import type { AnyEventObject } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import {
	createMockBehavior,
	createMockSubscriber,
} from "../testing/create_mock";
import type { FromEventTypes } from "../utils/mod";
import { createPublishAction, withPubSub } from "./pub_sub";

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

		expect(action).toStrictEqual({ type: "publish", exec: expect.anything() });
	});

	it("should call publish when the action is executed", () => {
		const publish = jest.fn();
		const publishAction = createPublishAction(publish);

		const action = publishAction({ type: "test" });
		// @ts-expect-error We don't care about the arguments
		action.exec?.();

		expect(publish).nthCalledWith(1, { type: "test" });
	});
});
