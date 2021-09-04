import { EventObject } from "xstate";

export type {
	SubscribeEvent,
	UnsubscribeEvent,
	WithSubscriptions,
	SubEvents,
	EventType,
} from "./subscribe_events";

export { createSubscriptions } from "./subscriptions";

/** Type predicate to limit an {@link EventObject} to an specific event */
export function is<E extends EventObject>(
	type: E["type"],
	event: EventObject
): event is E {
	return event.type === type;
}
