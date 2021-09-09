import { EventObject } from "xstate";
import { BaseActorRef } from "../utils/types";

export type EventType<E extends EventObject> = E["type"] | "*";

export type SubEvents<E extends EventObject> =
	| SubscribeEvent<E>
	| UnsubscribeEvent<E>;

export type WithSubscriptions<E extends EventObject> = E | SubEvents<E>;

////////////////////////////////////////////////////////////////////////////////

export interface SubscribeEvent<
	E extends EventObject,
	Actor extends BaseActorRef<E> = BaseActorRef<E>
> extends EventObject {
	type: "xsystem.subscribe";
	ref: Actor;
	events: EventType<E>[];
}

/** Returns an {@link SubscribeEvent}. */
export function subscribe<
	E extends EventObject,
	Actor extends BaseActorRef<E> = BaseActorRef<E>
>(
	ref: SubscribeEvent<E, Actor>["ref"],
	events?: SubscribeEvent<E, Actor>["events"]
): SubscribeEvent<E, Actor> {
	return {
		type: "xsystem.subscribe",
		ref,
		events: events ?? ["*"],
	};
}

////////////////////////////////////////////////////////////////////////////////

export interface UnsubscribeEvent<
	E extends EventObject,
	Actor extends BaseActorRef<E> = BaseActorRef<E>
> extends EventObject {
	type: "xsystem.unsubscribe";
	ref: Actor;
}

/** Returns an {@link UnsubscribeEvent}. */
export function unsubscribe<
	E extends EventObject,
	Actor extends BaseActorRef<E> = BaseActorRef<E>
>(ref: UnsubscribeEvent<E, Actor>["ref"]): UnsubscribeEvent<E, Actor> {
	return {
		type: "xsystem.unsubscribe",
		ref,
	};
}
