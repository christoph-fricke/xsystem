import type { EventObject, BaseActorRef } from "xstate";
import type { Wildcard } from "./wildcard";

export type EventMatch<E extends EventObject> =
	| E["type"]
	| Wildcard<E["type"], ".">;

/** Either a {@link SubscribeEvent} or {@link UnsubscribeEvent}. */
export type SubEvent<E extends EventObject> =
	| SubscribeEvent<E>
	| UnsubscribeEvent;

export interface SubscribeEvent<E extends EventObject> extends EventObject {
	type: "xsystem.subscribe";
	ref: BaseActorRef<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
	matches: EventMatch<E>[];
}

/** Returns an {@link SubscribeEvent}. */
export function subscribe<E extends EventObject>(
	ref: SubscribeEvent<E>["ref"],
	matches?: SubscribeEvent<E>["matches"]
): SubscribeEvent<E> {
	return {
		type: "xsystem.subscribe",
		ref,
		matches: matches ?? ["*"],
	};
}

export interface UnsubscribeEvent extends EventObject {
	type: "xsystem.unsubscribe";
	ref: BaseActorRef<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Returns an {@link UnsubscribeEvent}. */
export function unsubscribe(ref: UnsubscribeEvent["ref"]): UnsubscribeEvent {
	return {
		type: "xsystem.unsubscribe",
		ref,
	};
}
