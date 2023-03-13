import type { Behavior, EventObject } from "xstate";
import { is } from "../utils/mod";

export interface SetEvent<Data> extends EventObject {
	type: "xsystem.data.set";
	data: Data;
}

/** Creates a {@link SetEvent}, which replaces data stored in an actor spawned from the {@link createData} behavior. */
export function set<Data>(data: Data): SetEvent<Data> {
	return { type: "xsystem.data.set", data };
}

export interface ResetEvent extends EventObject {
	type: "xsystem.data.reset";
}

/** Creates a {@link ResetEvent}, which resets data stored in an actor spawned from the {@link createData} behavior to its initial value. */
export function reset(): ResetEvent {
	return { type: "xsystem.data.reset" };
}

type DataEvent<Data> = SetEvent<Data> | ResetEvent;

// TODO: To allow more semantically data storage we might want to process any event
// that contains a data prop as a set event. Then the events can have names meaningful
// to the application.

/**
 * Creates a behavior that stores some generic data in an actor's state.
 * It acts a simple value store.
 * The stored data can be updated with a {@link set} event or reset with
 * a {@link reset} event. As with any actor state, the data can be accessed through
 * `actor.getSnapshot()`.
 *
 * @example Simply storing a string:
 * ```typescript
 * import { spawnBehavior } from "xstate/lib/behaviors";
 * import { createData, set, reset } from "xsystem";
 *
 * // Create an actor containing the initial data as state.
 * const store = spawnBehavior(createData("Hello World"));
 * store.getSnapshot() // => "Hello World"
 *
 * // Update the stored data
 * store.send(set("Hello Again"))
 * store.getSnapshot() // => "Hello Again"
 *
 * // Reset the stored data
 * store.send(reset())
 * store.getSnapshot() // => "Hello World"
 * ```
 */
export function createData<Data>(
	initial: Data
): Behavior<DataEvent<Data>, Data> {
	return {
		initialState: initial,
		transition: (state, event) => {
			if (is<SetEvent<Data>>("xsystem.data.set", event)) {
				return event.data;
			}

			if (is<ResetEvent>("xsystem.data.reset", event)) {
				return initial;
			}

			return state;
		},
	};
}
