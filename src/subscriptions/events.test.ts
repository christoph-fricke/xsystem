import type { ActorRef } from "xstate";
import { subscribe, unsubscribe } from "./events";

describe(subscribe, () => {
	it("should construct a subscribe event", () => {
		const baseActor = { send: () => void 0 };

		const event = subscribe(baseActor);

		expect(event).toMatchObject({
			type: "xsystem.subscribe",
			ref: baseActor,
			matches: ["*"],
		});
	});

	it("should accept a list of filtered event types", () => {
		const baseActor = { send: () => void 0 };

		const event = subscribe(baseActor, ["test_event", "event"]);

		expect(event).toMatchObject({
			type: "xsystem.subscribe",
			ref: baseActor,
			matches: ["test_event", "event"],
		});
	});

	it("should be possible to provide an actor ref as the reference", () => {
		// Previously, a bug existed where it was not possible to pass an actor ref
		// with an typed event generic. The typing should not care about the receive-able
		// event of the reference as it can never be fully typed down the line and always
		// led to problems and complexity without user benefits.
		const actor = {} as ActorRef<{ type: "test" }, null>;

		// Test is considered passing when this expression does not produce a type error
		subscribe<{ type: "publish" }>(actor);
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

	it("should be possible to provide an actor ref as the reference", () => {
		// Previously, a bug existed where it was not possible to pass an actor ref
		// with an typed event generic. The typing should not care about the receive-able
		// event of the reference as it can never be fully typed down the line and always
		// led to problems and complexity without user benefits.
		const actor = {} as ActorRef<{ type: "test" }, null>;

		// Test is considered passing when this expression does not produce a type error
		unsubscribe(actor);
	});
});
