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

export interface UpdateEvent<Data> extends EventObject {
	type: "xsystem.data.update";
	data: Data extends object ? Partial<Data> : Data;
}

/**
 * Creates a {@link UpdateEvent}, which behaves like a {@link SetEvent} except for objects.
 * When the stored data is an object, the data is shallow merged into the existing object,
 * allowing for partial updates.
 */
export function update<Data>(
	data: UpdateEvent<Data>["data"]
): UpdateEvent<Data> {
	return { type: "xsystem.data.update", data };
}

export interface ResetEvent extends EventObject {
	type: "xsystem.data.reset";
}

/** Creates a {@link ResetEvent}, which resets data stored in an actor spawned from the {@link createData} behavior to its initial value. */
export function reset(): ResetEvent {
	return { type: "xsystem.data.reset" };
}

type DataEvent<Data> = SetEvent<Data> | UpdateEvent<Data> | ResetEvent;

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
 * // Replace the stored data
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

			if (is<UpdateEvent<Data>>("xsystem.data.update", event)) {
				return isObject(event.data)
					? { ...state, ...(event.data as Partial<Data>) }
					: (event.data as Data);
			}

			if (is<ResetEvent>("xsystem.data.reset", event)) {
				return initial;
			}

			return state;
		},
	};
}

function isObject(data: unknown): data is object {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
