import { spawnBehavior } from "xstate/lib/behaviors";
import { createData, reset, ResetEvent, set, SetEvent } from "./data";

describe(set, () => {
	it("should create a set-data event", () => {
		expect(set(123)).toStrictEqual<SetEvent<number>>({
			type: "xsystem.data.set",
			data: 123,
		});
	});
});

describe(reset, () => {
	it("should create a reset event", () => {
		expect(reset()).toStrictEqual<ResetEvent>({ type: "xsystem.data.reset" });
	});
});

describe(createData, () => {
	it("should create an actor with the initial data as initial state", () => {
		const initial = { test: 123 };
		const actor = spawnBehavior(createData(initial));

		expect(actor.getSnapshot()).toBe(initial);
	});

	it("should replace the current state with data provided by a set event", () => {
		const actor = spawnBehavior(createData(123));

		actor.send(set(456));

		expect(actor.getSnapshot()).toBe(456);
	});

	it("should reset the state to the initial data when a reset event is received", () => {
		const initial = { test: 123 };
		const actor = spawnBehavior(createData(initial));

		actor.send(set({ test: 456 }));
		actor.send(reset());

		expect(actor.getSnapshot()).toBe(initial);
	});

	it("should return the current state when unknown event are received", () => {
		const actor = spawnBehavior(createData({ test: 123 }));
		const newData = { test: 456 };

		actor.send(set(newData));
		actor.send({ type: "test" } as unknown as ResetEvent);

		expect(actor.getSnapshot()).toBe(newData);
	});
});
