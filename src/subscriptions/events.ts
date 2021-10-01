import type { EventObject } from "xstate";
import type { BaseActorRef } from "../utils/types";
import type { Wildcard } from "./wildcard";

export type EventMatch<E extends EventObject> =
	| E["type"]
	| Wildcard<E["type"], ".">;

export type SubEvent<SEvent extends EventObject, AEvent extends EventObject> =
	| SubscribeEvent<SEvent, AEvent>
	| UnsubscribeEvent<SEvent, AEvent>;

export interface SubscribeEvent<
	SEvent extends EventObject,
	AEvent extends EventObject
> extends EventObject {
	type: "xsystem.subscribe";
	ref: BaseActorRef<SEvent | AEvent>;
	events: EventMatch<SEvent>[];
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
