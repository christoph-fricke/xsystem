import type { AnyEventObject, EventObject } from "xstate";

/** Type predicate to limit an {@link EventObject} to a specific event. */
export function is<E extends EventObject>(
	type: E["type"],
	event: AnyEventObject
): event is E {
	return event.type === type;
}
