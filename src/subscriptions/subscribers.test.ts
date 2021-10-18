import type { AnyEventObject } from "xstate";
import { createMockSubscriber } from "../testing/create_mock";
import { BucketMap } from "./bucket_map";
import { subscribe, unsubscribe } from "./events";
import type { Publish, SubscriberMap } from "./subscribers";
import {
	createPublishFunction,
	createSubscriberStructure,
	handleSubscribeEvent,
} from "./subscribers";

describe(createSubscriberStructure, () => {
	it("should use a bucket map as its data structure", () => {
		const subscribers = createSubscriberStructure();

		expect(subscribers).toBeInstanceOf(BucketMap);
	});
});

describe(handleSubscribeEvent, () => {
	let store: SubscriberMap<AnyEventObject>;

	beforeEach(() => (store = createSubscriberStructure()));

	it("should return false when the passed event is not a sub event", () => {
		const handled = handleSubscribeEvent(store, { type: "test" });

		expect(handled).toBe(false);
	});

	describe("handling subscribe", () => {
		it("should return true when the passed event is a subscribe event", () => {
			const [, ref] = createMockSubscriber();

			const handled = handleSubscribeEvent(store, subscribe(ref));

			expect(handled).toBe(true);
		});

		it("should add the subscriber to the provided event match", () => {
			const [, ref] = createMockSubscriber();

			handleSubscribeEvent(store, subscribe(ref, ["*", "event.*", "event"]));

			expect(store.get("*")).toContain(ref);
			expect(store.get("event.*")).toContain(ref);
			expect(store.get("event")).toContain(ref);
		});
	});

	describe("handling unsubscribe", () => {
		it("should return true when the passed event is an unsubscribe event", () => {
			const [, ref] = createMockSubscriber();

			const handled = handleSubscribeEvent(store, unsubscribe(ref));

			expect(handled).toBe(true);
		});

		it("should remove the subscriber from all matches", () => {
			const [, ref] = createMockSubscriber();
			store.add("*", ref);
			store.add("event.*", ref);
			store.add("event", ref);

			handleSubscribeEvent(store, unsubscribe(ref));

			expect(store.values()).not.toContain(ref);
		});
	});
});

describe(createPublishFunction, () => {
	const store = createSubscriberStructure();

	it("should return a function that is named 'publish'", () => {
		// Expecting that the function is named ensures a nice call stack
		const func = createPublishFunction(store);

		expect(func.name).toBe("publish");
	});

	describe("calling publish", () => {
		let store: SubscriberMap<AnyEventObject>;
		let publish: Publish<AnyEventObject>;

		beforeEach(() => {
			store = createSubscriberStructure();
			publish = createPublishFunction(store);
		});

		it("should send a given event to all subscriber that subscribed to the type", () => {
			const event = { type: "test.event" };
			const [handler1, subscriber1] = createMockSubscriber();
			const [handler2, subscriber2] = createMockSubscriber();

			store.add(event.type, subscriber1);
			store.add(event.type, subscriber2);
			publish(event);

			expect(handler1).nthCalledWith(1, event);
			expect(handler2).nthCalledWith(1, event);
		});

		it("should send a given event to all subscriber that used a wildcard", () => {
			const event = { type: "test.mock.event.sub" };
			const [handler1, subscriber1] = createMockSubscriber();
			const [handler2, subscriber2] = createMockSubscriber();
			const [handler3, subscriber3] = createMockSubscriber();
			const [handler4, subscriber4] = createMockSubscriber();

			store.add("*", subscriber1);
			store.add("test.*", subscriber2);
			store.add("test.mock.*", subscriber3);
			store.add("test.mock.event.*", subscriber4);
			publish(event);

			expect(handler1).nthCalledWith(1, event);
			expect(handler2).nthCalledWith(1, event);
			expect(handler3).nthCalledWith(1, event);
			expect(handler4).nthCalledWith(1, event);
		});
	});
});
