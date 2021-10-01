import { subscribe, unsubscribe } from "./events";

describe(subscribe, () => {
	it("should construct a subscribe event", () => {
		const baseActor = { send: () => void 0 };

		const event = subscribe(baseActor);

		expect(event).toMatchObject({
			type: "xsystem.subscribe",
			ref: baseActor,
			events: ["*"],
		});
	});

	it("should accept a list of filtered event types", () => {
		const baseActor = { send: () => void 0 };

		const event = subscribe(baseActor, ["test_event", "event"]);

		expect(event).toMatchObject({
			type: "xsystem.subscribe",
			ref: baseActor,
			events: ["test_event", "event"],
		});
	});
});

describe(unsubscribe, () => {
	it("should construct an unsubscribe event", () => {
		const baseActor = { send: () => void 0 };

		const event = unsubscribe(baseActor);

		expect(event).toMatchObject({
			type: "xsystem.unsubscribe",
			ref: baseActor,
		});
	});
});
