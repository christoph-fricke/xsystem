import { mock, anyObject } from "jest-mock-extended";
import type { AnyEventObject, Behavior } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { withHistory, undo, redo } from "./history";

type AnyBehavior = Behavior<AnyEventObject, unknown>;

describe(undo, () => {
	it("should construct an undo event", () => {
		const event = undo();

		expect(event).toStrictEqual({ type: "xsystem.undo" });
	});
});

describe(redo, () => {
	it("should construct an redo event", () => {
		const event = redo();

		expect(event).toStrictEqual({ type: "xsystem.redo" });
	});
});

describe(withHistory, () => {
	it("should return the wrapped initial state", () => {
		const behavior = mock<AnyBehavior>({ initialState: "Initial" });

		const wrapped = withHistory(behavior);

		expect(wrapped.initialState).toBe("Initial");
	});

	it("should forward events to the wrapped behavior", () => {
		const behavior = mock<AnyBehavior>({ initialState: "Initial" });
		const event = { type: "event" };

		const actor = spawnBehavior(withHistory(behavior));
		actor.send(event);

		expect(behavior.transition).toBeCalledTimes(1);
		expect(behavior.transition).toBeCalledWith("Initial", event, anyObject());
	});

	it("should overwrite previously produced state when an event is changed in the middle of the history", () => {
		const behavior = mock<AnyBehavior>({ initialState: "Initial" });
		behavior.transition.mockReturnValueOnce("First");
		behavior.transition.mockReturnValueOnce("Second");
		const actor = spawnBehavior(withHistory(behavior));

		// Create a history and go back to the middle
		actor.send("transition");
		actor.send("transition");
		expect(actor.getSnapshot()).toBe("Second");
		actor.send(undo());
		actor.send(undo());
		expect(actor.getSnapshot()).toBe("Initial");

		// Sending another event removes the previously produced state
		behavior.transition.mockReturnValueOnce("NewState");
		actor.send("transition");
		expect(actor.getSnapshot()).toBe("NewState");
		actor.send(undo());
		expect(actor.getSnapshot()).toBe("Initial");

		// No change to find "First" and "Second" in the future
		actor.send(redo());
		expect(actor.getSnapshot()).toBe("NewState");
		actor.send(redo());
		expect(actor.getSnapshot()).toBe("NewState");
	});

	describe(`sending undo`, () => {
		it("should not transition the wrapped behavior", () => {
			const behavior = mock<AnyBehavior>();

			const actor = spawnBehavior(withHistory(behavior));
			actor.send(undo());

			expect(behavior.transition).not.toBeCalled();
		});

		it("should return the initialState when no other events have been sent yet", () => {
			const behavior = mock<AnyBehavior>({ initialState: "Initial" });

			const actor = spawnBehavior(withHistory(behavior));
			actor.send(undo());

			expect(actor.getSnapshot()).toBe(behavior.initialState);
		});

		it("should return the previous state of the actor when multiple state updates exist", () => {
			const behavior = mock<AnyBehavior>({ initialState: "Initial" });
			behavior.transition.mockReturnValueOnce("First");
			behavior.transition.mockReturnValueOnce("Second");
			const actor = spawnBehavior(withHistory(behavior));

			// Cause two state updates in the actor
			actor.send("transition");
			actor.send("transition");
			expect(actor.getSnapshot()).toBe("Second");

			// Undo return the previous state
			actor.send(undo());
			expect(actor.getSnapshot()).toBe("First");
			actor.send(undo());
			expect(actor.getSnapshot()).toBe("Initial");
		});
	});

	describe(`sending redo`, () => {
		it("should not transition the wrapped behavior", () => {
			const behavior = mock<AnyBehavior>();
			const actor = spawnBehavior(withHistory(behavior));

			actor.send(redo());

			expect(behavior.transition).not.toBeCalled();
		});

		it("should return the initialState when no other events have been sent", () => {
			const behavior = mock<AnyBehavior>({ initialState: "Initial" });
			const actor = spawnBehavior(withHistory(behavior));

			actor.send(redo());

			expect(actor.getSnapshot()).toBe(behavior.initialState);
		});

		it("should return the next state when redo is sent after undo", () => {
			const behavior = mock<AnyBehavior>({ initialState: "Initial" });
			behavior.transition.mockReturnValueOnce("NewState");
			const actor = spawnBehavior(withHistory(behavior));

			actor.send("transition");
			actor.send(undo());
			actor.send(redo());

			expect(actor.getSnapshot()).toBe("NewState");
		});

		it("should return the next state of the actor when undo has been used before", () => {
			const behavior = mock<AnyBehavior>({ initialState: "Initial" });
			behavior.transition.mockReturnValueOnce("First");
			behavior.transition.mockReturnValueOnce("Second");
			const actor = spawnBehavior(withHistory(behavior));

			// Cause two state updates in the actor
			actor.send("transition");
			actor.send("transition");
			expect(actor.getSnapshot()).toBe("Second");

			// The state history can be walked back and forth
			actor.send(undo());
			actor.send(undo());
			expect(actor.getSnapshot()).toBe("Initial");
			actor.send(redo());
			expect(actor.getSnapshot()).toBe("First");
			actor.send(redo());
			expect(actor.getSnapshot()).toBe("Second");
		});
	});
});
