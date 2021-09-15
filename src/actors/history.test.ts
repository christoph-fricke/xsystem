import { spawnBehavior } from "xstate/lib/behaviors";
import { withHistory, undoEvent, redoEvent } from "./history";

describe(`${undoEvent.name}`, () => {
	test("should construct an undo event", () => {
		const event = undoEvent();

		expect(event).toStrictEqual({ type: "xsystem.undo" });
	});
});

describe(`${redoEvent.name}`, () => {
	test("should construct an redo event", () => {
		const event = redoEvent();

		expect(event).toStrictEqual({ type: "xsystem.redo" });
	});
});

describe(`${withHistory.name}`, () => {
	test("should return the wrapped initial state", () => {
		const behavior = withHistory({
			initialState: "Initial",
			transition: (state) => state,
		});

		expect(behavior.initialState).toBe("Initial");
	});

	test("should call the wrapped start behavior", () => {
		const mock = jest.fn().mockReturnValue("Start Return");
		const behavior = withHistory({
			initialState: "Initial",
			transition: (state) => state,
			start: mock,
		});

		// Creates an actors which calls `start`
		const actor = spawnBehavior(behavior);

		expect(mock).toBeCalledTimes(1);
		expect(actor.getSnapshot()).toBe("Start Return");
	});

	test("should forward event to the wrapped behavior", () => {
		const mock = jest.fn();
		const behavior = withHistory({
			initialState: "Initial",
			transition: mock,
		});

		const actor = spawnBehavior(behavior);
		actor.send({ type: "event" });

		expect(mock).toBeCalledTimes(1);
		expect(mock).toBeCalledWith(
			"Initial",
			{ type: "event" },
			expect.anything()
		);
	});

	describe(`sending undo`, () => {
		test("should not transition the wrapped behavior", () => {
			const mock = jest.fn();
			const behavior = withHistory({
				initialState: "Initial",
				transition: mock,
			});

			const actor = spawnBehavior(behavior);
			actor.send(undoEvent());

			expect(mock).not.toBeCalled();
		});

		test("should return the initialState when no other events have been sent", () => {
			const behavior = withHistory({
				initialState: "Initial",
				transition: () => "",
			});

			const actor = spawnBehavior(behavior);
			actor.send(undoEvent());

			expect(actor.getSnapshot()).toBe("Initial");
		});
	});

	describe(`sending redo`, () => {
		test("should not transition the wrapped behavior", () => {
			const mock = jest.fn();
			const behavior = withHistory({
				initialState: "Initial",
				transition: mock,
			});

			const actor = spawnBehavior(behavior);
			actor.send(redoEvent());

			expect(mock).not.toBeCalled();
		});

		test("should return the initialState when no other events have been sent", () => {
			const behavior = withHistory({
				initialState: "Initial",
				transition: () => "",
			});

			const actor = spawnBehavior(behavior);
			actor.send(redoEvent());

			expect(actor.getSnapshot()).toBe("Initial");
		});
	});
});
