import type { Behavior, EventObject } from "xstate";
import { createEvent, EventFrom } from "../utils/mod";

/** Creates an undo event. */
export const undo = createEvent("xsystem.undo");

/** Creates an redo event. */
export const redo = createEvent("xsystem.redo");

type HistoryEvent = EventFrom<typeof undo> | EventFrom<typeof redo>;

/** Higher order type to wrap the type for a {@link Behavior} with history events. */
export type WithHistory<B> = B extends Behavior<infer E, infer S>
	? Behavior<HistoryEvent | E, S>
	: never;

interface HistoryLink<S> {
	value: S;
	prev?: HistoryLink<S>;
	next?: HistoryLink<S>;
}

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
	let currentLink: HistoryLink<S> = {
		value: behavior.initialState,
	};

	return {
		...behavior,
		transition: (state, event, ctx) => {
			if (undo.match(event)) {
				// "undo" is a no-op if there is no previous state
				currentLink = currentLink.prev ?? currentLink;
				return currentLink.value;
			}

			if (redo.match(event)) {
				// "redo" is a no-op if there is no future state
				currentLink = currentLink.next ?? currentLink;
				return currentLink.value;
			}

			const nextLink: HistoryLink<S> = {
				value: behavior.transition(state, event, ctx),
				prev: currentLink,
			};
			currentLink.next = nextLink;
			currentLink = nextLink;

			return currentLink.value;
		},
	};
}
