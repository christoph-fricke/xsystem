import { EventObject } from "xstate";
import { BaseActorRef } from "../utils/types";

// The `SEvent` generic defines the event an actor can subscribe to.
// The `AEvent` generic defines the other event that can also be sent to the
// subscribing actor. It exists to make the model at this level complete.

export type EventTypeMatch<SEvent extends EventObject> = SEvent["type"] | "*";

export type SubEvents<SEvent extends EventObject, AEvent extends EventObject> =
	| SubscribeEvent<SEvent, AEvent>
	| UnsubscribeEvent<SEvent, AEvent>;

////////////////////////////////////////////////////////////////////////////////

export interface SubscribeEvent<
	SEvent extends EventObject,
	AEvent extends EventObject
> extends EventObject {
	type: "xsystem.subscribe";
	ref: BaseActorRef<SEvent | AEvent>;
	events: EventTypeMatch<SEvent>[];
}

/** Returns an {@link SubscribeEvent}. */
export function subscribe<
	SEvent extends EventObject,
	AEvent extends EventObject
>(
	ref: SubscribeEvent<SEvent, AEvent>["ref"],
	events?: SubscribeEvent<SEvent, AEvent>["events"]
): SubscribeEvent<SEvent, AEvent> {
	return {
		type: "xsystem.subscribe",
		ref,
		events: events ?? ["*"],
	};
}

////////////////////////////////////////////////////////////////////////////////

export interface UnsubscribeEvent<
	SEvent extends EventObject,
	AEvent extends EventObject
> extends EventObject {
	type: "xsystem.unsubscribe";
	ref: BaseActorRef<SEvent | AEvent>;
}

/** Returns an {@link UnsubscribeEvent}. */
export function unsubscribe<
	SEvent extends EventObject,
	AEvent extends EventObject
>(
	ref: UnsubscribeEvent<SEvent, AEvent>["ref"]
): UnsubscribeEvent<SEvent, AEvent> {
	return {
		type: "xsystem.unsubscribe",
		ref,
	};
}
