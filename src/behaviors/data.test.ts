import { spawnBehavior } from "xstate/lib/behaviors";
import {
	createData,
	reset,
	ResetEvent,
	set,
	SetEvent,
	update,
	UpdateEvent,
} from "./data";

describe(set, () => {
	it("should create a set-data event", () => {
		expect(set(123)).toStrictEqual<SetEvent<number>>({
			type: "xsystem.data.set",
			data: 123,
		});
	});
});

describe(update, () => {
	it("should create an update event", () => {
		expect(update({ username: "Test" })).toStrictEqual<
			UpdateEvent<{ username: string; email: string }>
		>({
			type: "xsystem.data.update",
			data: { username: "Test" },
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

	it("should replace the current state when a non-object data update event is received", () => {
		const arrayStore = spawnBehavior(createData([123]));
		const numberStore = spawnBehavior(createData(123));

		arrayStore.send(update([456]));
		numberStore.send(update(456));

		expect(arrayStore.getSnapshot()).toStrictEqual([456]);
		expect(numberStore.getSnapshot()).toBe(456);
	});

	it("should shallow update the current state when a object data update event is received", () => {
		const initial = { first: 123, second: 789 };
		const actor = spawnBehavior(createData(initial));

		actor.send(update({ first: 456 }));

		expect(actor.getSnapshot()).toStrictEqual({ first: 456, second: 789 });
	});

	it("should reset the state to the initial data when a reset event is received", () => {
		const initial = { test: 123 };
		const actor = spawnBehavior(createData(initial));

		actor.send(set({ test: 456 }));
		actor.send(reset());

		expect(actor.getSnapshot()).toBe(initial);
	});

	it("should return the current state when unknown events are received", () => {
		const actor = spawnBehavior(createData({ test: 123 }));
		const newData = { test: 456 };

		actor.send(set(newData));
		actor.send({ type: "test" } as unknown as ResetEvent);

		expect(actor.getSnapshot()).toBe(newData);
	});
});
