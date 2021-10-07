import type { AnyEventObject, Event } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { createEventBus, EventBus } from "./event_bus";

function createMockSubscriber(): [typeof handler, typeof subscriber] {
	const handler = jest.fn<void, [Event<AnyEventObject>]>();
	const subscriber = { send: handler };

	return [handler, subscriber];
}

type BasicEvent = { type: "basic.first" } | { type: "basic.second" };
type ExtendedEvent = { type: "extended.first" } | { type: "extended.second" };

describe(createEventBus, () => {
	it("should proxy received events to a subscriber", () => {
		const [handler, subscriber] = createMockSubscriber();
		const bus = spawnBehavior(createEventBus<BasicEvent>());
		const event1: BasicEvent = { type: "basic.first" };
		const event2: BasicEvent = { type: "basic.second" };

		bus.send(subscribe(subscriber));
		bus.send(event1);
		bus.send(event2);

		expect(handler).nthCalledWith(1, event1);
		expect(handler).nthCalledWith(2, event2);
	});

	it("should proxy received events to all subscribers", () => {
		const [handler1, subscriber1] = createMockSubscriber();
		const [handler2, subscriber2] = createMockSubscriber();
		const bus = spawnBehavior(createEventBus<BasicEvent>());
		const event: BasicEvent = { type: "basic.first" };

		bus.send(subscribe(subscriber1));
		bus.send(subscribe(subscriber2));
		bus.send(event);

		expect(handler1).nthCalledWith(1, event);
		expect(handler2).nthCalledWith(1, event);
	});

	it("should not proxy subscribe events to a subscriber", () => {
		const [handler1, subscriber1] = createMockSubscriber();
		const [, subscriber2] = createMockSubscriber();
		const bus = spawnBehavior(createEventBus<BasicEvent>());

		bus.send(subscribe(subscriber1));
		bus.send(subscribe(subscriber2));

		expect(handler1).not.toBeCalled();
	});

	it("should not proxy unsubscribe events to a subscriber", () => {
		const [handler1, subscriber1] = createMockSubscriber();
		const [, subscriber2] = createMockSubscriber();
		const bus = spawnBehavior(createEventBus<BasicEvent>());

		bus.send(subscribe(subscriber1));
		bus.send(unsubscribe(subscriber2));

		expect(handler1).not.toBeCalled();
	});

	it("should be possible to pass an extended event bus to a focused argument", () => {
		const receiver = (bus: EventBus<BasicEvent>) => void bus;
		const bus = spawnBehavior(createEventBus<BasicEvent | ExtendedEvent>());

		// Test is considered passing when this expression does not produce a type error
		receiver(bus);
	});

	it("should not proxy events to uninterested subscribers", () => {
		const [handler, subscriber] = createMockSubscriber();
		const bus = spawnBehavior(createEventBus<BasicEvent | ExtendedEvent>());
		const event1: BasicEvent = { type: "basic.first" };
		const event2: ExtendedEvent = { type: "extended.first" };

		bus.send(subscribe(subscriber, ["basic.*"]));
		bus.send(event1);
		bus.send(event2);

		expect(handler).toBeCalledWith(event1);
		expect(handler).not.toBeCalledWith(event2);
	});
});
