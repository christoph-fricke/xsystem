import type { Behavior, EventObject } from "xstate";
import { is } from "../utils/mod";

interface UndoEvent extends EventObject {
	type: "xsystem.undo";
}

/** Creates an {@link UndoEvent}. */
export function undo(): UndoEvent {
	return { type: "xsystem.undo" };
}

interface RedoEvent extends EventObject {
	type: "xsystem.redo";
}

/** Creates an {@link RedoEvent}. */
export function redo(): RedoEvent {
	return { type: "xsystem.redo" };
}

/** Higher order type to wrap the type for a {@link Behavior} with history events. */
export type WithHistory<B> = B extends Behavior<infer E, infer S>
	? Behavior<UndoEvent | RedoEvent | E, S>
	: never;

/**
 * Adds undo/redo behavior to a given {@link Behavior}.
 * Undo/Redo is based on state snapshots and will not rerun past events.
 *
 * Inspired by the
 * [corresponding mobx-state-tree middleware](https://github.com/mobxjs/mobx-state-tree/blob/master/packages/mst-middlewares/README.md#timetraveller).
 */
export function withHistory<E extends EventObject, S>(
	behavior: Behavior<E, S>
): WithHistory<typeof behavior> {
	let index = 0;
	const history: S[] = [behavior.initialState];

	return {
		...behavior,
		transition: (state, event, ctx) => {
			if (is<UndoEvent>("xsystem.undo", event)) {
				// "undo" is a no-op if there is no previous state
				const previousState = index > 0 ? history[--index] : history[index];

				assertValue(previousState);
				return previousState;
			}

			if (is<RedoEvent>("xsystem.redo", event)) {
				// "redo" is a no-op if there is no future state
				const futureState =
					index + 1 < history.length ? history[++index] : history[index];

				assertValue(futureState);
				return futureState;
			}

			const nextState = behavior.transition(state, event, ctx);
			history[++index] = nextState;
			// Changing state during time traveling rewrites the future.
			if (history.length !== index + 1) history.length = index + 1;

			return nextState;
		},
	};
}

function assertValue<T>(value: T | undefined): asserts value is T {
	if (value === undefined)
		throw new Error("Undo/Redo used an index that is out of bounds!");
}
