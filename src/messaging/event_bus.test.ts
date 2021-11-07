import { mock } from "jest-mock-extended";
import type { ActorRef, AnyEventObject } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, unsubscribe } from "../subscriptions/mod";
import { createEventBus, EventBus } from "./event_bus";

type AnyActorRef = ActorRef<AnyEventObject, unknown>;

type BasicEvent = { type: "basic.first" } | { type: "basic.second" };
type ExtendedEvent = { type: "extended.first" } | { type: "extended.second" };

describe(createEventBus, () => {
	it("should proxy received events to a subscriber", () => {
		const subscriber = mock<AnyActorRef>();
		const bus = spawnBehavior(createEventBus<BasicEvent>());
		const event1: BasicEvent = { type: "basic.first" };
		const event2: BasicEvent = { type: "basic.second" };

		bus.send(subscribe(subscriber));
		bus.send(event1);
		bus.send(event2);

		expect(subscriber.send).toBeCalledTimes(2);
		expect(subscriber.send).nthCalledWith(1, event1);
		expect(subscriber.send).nthCalledWith(2, event2);
	});

	it("should proxy received events to all subscribers", () => {
		const subscriber1 = mock<AnyActorRef>();
		const subscriber2 = mock<AnyActorRef>();
		const bus = spawnBehavior(createEventBus<BasicEvent>());
		const event: BasicEvent = { type: "basic.first" };

		bus.send(subscribe(subscriber1));
		bus.send(subscribe(subscriber2));
		bus.send(event);

		expect(subscriber1.send).toBeCalledWith(event);
		expect(subscriber2.send).toBeCalledWith(event);
	});

	it("should not proxy subscribe events to a subscriber", () => {
		const subscriber1 = mock<AnyActorRef>();
		const subscriber2 = mock<AnyActorRef>();
		const bus = spawnBehavior(createEventBus<BasicEvent>());

		bus.send(subscribe(subscriber1));
		bus.send(subscribe(subscriber2));

		expect(subscriber1.send).not.toBeCalled();
	});

	it("should not proxy unsubscribe events to a subscriber", () => {
		const subscriber1 = mock<AnyActorRef>();
		const subscriber2 = mock<AnyActorRef>();
		const bus = spawnBehavior(createEventBus<BasicEvent>());

		bus.send(subscribe(subscriber1));
		bus.send(unsubscribe(subscriber2));

		expect(subscriber1.send).not.toBeCalled();
	});

	it("should not proxy events to uninterested subscribers", () => {
		const subscriber = mock<AnyActorRef>();
		const bus = spawnBehavior(createEventBus<BasicEvent | ExtendedEvent>());
		const event1: BasicEvent = { type: "basic.first" };
		const event2: ExtendedEvent = { type: "extended.first" };

		bus.send(subscribe(subscriber, ["basic.*"]));
		bus.send(event1);
		bus.send(event2);

		expect(subscriber.send).toBeCalledWith(event1);
		expect(subscriber.send).not.toBeCalledWith(event2);
	});
});

describe("EventBus interface", () => {
	it("should be allowed to provide a bus that supports more events than required", () => {
		const receiver = (bus: EventBus<BasicEvent>) => void bus;
		const bus = {} as EventBus<BasicEvent | ExtendedEvent>;

		// Shall not produce a type error.
		receiver(bus);
	});

	it("should throw an error if the provided bus does not support all required events", () => {
		const receiver = (bus: EventBus<BasicEvent>) => void bus;
		const bus = {} as EventBus<ExtendedEvent>;

		//@ts-expect-error The provided bus must required events.
		receiver(bus);
	});
});
