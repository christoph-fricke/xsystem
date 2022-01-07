import { createMachine, interpret } from "xstate";
import { createModel } from "xstate/lib/model";
import { createEvent, EventFrom, fromEventCreators } from "./event_creator";

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

describe(fromEventCreators, () => {
	it("should aggregate event creators into an events object", () => {
		const first = createEvent("test.first", (id: string) => ({ id }));
		const second = createEvent("test.second");

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const object = fromEventCreators(first, second);

		expect(object).toStrictEqual({
			"test.first": first,
			"test.second": second,
		});
	});

	it("should make it easier to attach event creators to models", () => {
		const first = createEvent("test.first", (id: string) => ({ id }));
		const second = createEvent("test.second");

		const model = createModel(null, {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			events: fromEventCreators(first, second),
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(model.events["test.first"]("123")).toStrictEqual({
			type: "test.first",
			id: "123",
		});
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(model.events["test.second"]()).toStrictEqual({
			type: "test.second",
		});
	});
});
