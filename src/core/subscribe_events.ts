import { BaseActorRef, EventObject } from "xstate";

export type EventType<E extends EventObject> = E["type"] | "*";

export type SubEvents<E extends EventObject> =
	| SubscribeEvent<E>
	| UnsubscribeEvent<E>;

export type WithSubscriptions<E extends EventObject> = E | SubEvents<E>;

export interface SubscribeEvent<E extends EventObject> extends EventObject {
	type: "xsystem.subscribe";
	ref: BaseActorRef<E>;
	eventTypes?: EventType<E>[];
}

/** Returns an {@link SubscribeEvent}. */
export function subscribe<E extends EventObject>(
	ref: SubscribeEvent<E>["ref"],
	types: SubscribeEvent<E>["eventTypes"]
): SubscribeEvent<E> {
	return {
		type: "xsystem.subscribe",
		ref,
		eventTypes: types,
	};
}

export interface UnsubscribeEvent<E extends EventObject> extends EventObject {
	type: "xsystem.unsubscribe";
	ref: BaseActorRef<E>;
}

/** Returns an {@link UnsubscribeEvent}. */
export function unsubscribe<E extends EventObject>(
	ref: UnsubscribeEvent<E>["ref"]
): UnsubscribeEvent<E> {
	return {
		type: "xsystem.unsubscribe",
		ref,
	};
}
