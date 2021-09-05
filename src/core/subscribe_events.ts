import { AnyEventObject, BaseActorRef, EventObject } from "xstate";

export type EventType<E extends EventObject> = E["type"] | "*";

export type SubEvents<
	E extends EventObject,
	M extends EventObject = AnyEventObject
> = SubscribeEvent<E, M> | UnsubscribeEvent<E, M>;

export type WithSubscriptions<
	E extends EventObject,
	M extends EventObject = AnyEventObject
> = E | SubEvents<E, M>;

export interface SubscribeEvent<
	E extends EventObject,
	M extends EventObject = AnyEventObject
> extends EventObject {
	type: "xsystem.subscribe";
	ref: BaseActorRef<E | M>;
	events: EventType<E>[];
}

/** Returns an {@link SubscribeEvent}. */
export function subscribe<
	E extends EventObject,
	M extends EventObject = AnyEventObject
>(
	ref: SubscribeEvent<E, M>["ref"],
	events?: SubscribeEvent<E, M>["events"]
): SubscribeEvent<E, M> {
	return {
		type: "xsystem.subscribe",
		ref,
		events: events ?? ["*"],
	};
}

export interface UnsubscribeEvent<
	E extends EventObject,
	M extends EventObject = AnyEventObject
> extends EventObject {
	type: "xsystem.unsubscribe";
	ref: BaseActorRef<E | M>;
}

/** Returns an {@link UnsubscribeEvent}. */
export function unsubscribe<
	E extends EventObject,
	M extends EventObject = AnyEventObject
>(ref: UnsubscribeEvent<E, M>["ref"]): UnsubscribeEvent<E, M> {
	return {
		type: "xsystem.unsubscribe",
		ref,
	};
}
