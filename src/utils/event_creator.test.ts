import { mock } from "jest-mock-extended";
import { ActorRef, createMachine, interpret } from "xstate";
import { createEvent, EventFrom } from "./event_creator";

describe(createEvent, () => {
	it("should return an event-creator function", () => {
		const test = createEvent("test.event");

		const ev = test();

		expect(ev).toStrictEqual({ type: "test.event" });
	});

	it("should attach the event type to the returned function", () => {
		const test = createEvent("test.event");

		expect(test.type).toBe("test.event");
	});

	it("should overwrite the `toString` method to return the event type", () => {
		const test = createEvent("test.event");

		expect(test.toString()).toBe("test.event");
	});

	it("should attach an `match` function to match events to the created event", () => {
		const test = createEvent("test.event");

		expect(test.match({ type: "test.event" })).toBe(true);
		expect(test.match({ type: "hello", num: 42 })).toBe(false);
	});

	it("should accept an payload creator as an optional argument", () => {
		const test = createEvent("test.event", (id: string) => ({ id }));

		const ev = test("123");

		expect(ev).toStrictEqual({ type: "test.event", id: "123" });
	});

	it("should display and throw an type error if the prepare callback does not return object", () => {
		// @ts-expect-error Must return something
		const noReturn = createEvent("test", (id: string) => {
			id;
		});
		// @ts-expect-error Must return an object
		const noObject = createEvent("test", (id: string) => id);

		expect(() => noReturn("123")).toThrowError(
			new TypeError("Prepare must return an object. Was: undefined")
		);
		expect(() => noObject("123")).toThrowError(
			new TypeError("Prepare must return an object. Was: 123")
		);
	});

	it("should provide a helper to construct event-handler callbacks when connecting actors", () => {
		const receiver =
			mock<
				ActorRef<
					EventFrom<typeof ev1> | EventFrom<typeof ev2>,
					{ ctxData: string }
				>
			>();

		const ev1 = createEvent("test.first");
		const ev2 = createEvent("test.second", (body: string) => ({ body }));

		const handleEv1 = ev1.createCallback(receiver);
		const handleEv2 = ev2.createCallback(receiver);

		handleEv1();
		handleEv2("body");

		expect(receiver.send).toBeCalledTimes(2);
		expect(receiver.send).nthCalledWith(1, ev1());
		expect(receiver.send).nthCalledWith(2, ev2("body"));

		const ev3 = createEvent("test.third");
		// @ts-expect-error Receiver does not accept "ev3" events
		ev3.createCallback(receiver);
	});

	it("should be possible to use created events in machine definitions", () => {
		const ping = createEvent("user.ping");
		const machine = createMachine({
			id: "ping",
			initial: "Ping",
			states: {
				Ping: {
					on: {
						[ping.type]: "Pong",
					},
				},
				Pong: {},
			},
		});

		const actor = interpret(machine).start();
		actor.send(ping());

		expect(actor.state.matches("Pong")).toBeTruthy();
	});
});

describe("EventFrom", () => {
	it("should extract the event schema from the creator function", () => {
		const test = createEvent("test.event", (id: string) => ({ id }));

		type Ev = EventFrom<typeof test>;

		// This assignment should not error.
		const e: Ev = {
			type: "test.event",
			id: "123",
		};

		expect(e).toBe(e);
	});
});
