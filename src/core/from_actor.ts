import { ActorRef, AnyEventObject, EventObject, InvokeCreator } from "xstate";
import { BaseActorRef } from "../utils/types";
import {
	subscribe,
	unsubscribe,
	EventTypeMatch,
	SubEvents,
} from "./subscribe_events";

type SubscribeAble<
	SEvent extends EventObject,
	AEvent extends EventObject,
	Actor = ActorRef<AnyEventObject>
> = Actor extends ActorRef<infer E, infer S>
	? ActorRef<E | SubEvents<SEvent, AEvent>, S>
	: never;

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<
	TContext,
	TEvent extends EventObject
>(
	getActor: (ctx: TContext, e: TEvent) => SubscribeAble<TEvent, TEvent>,
	events?: EventTypeMatch<TEvent>[]
): InvokeCreator<TContext, TEvent> {
	return (ctx, e) => (send, onReceive) => {
		const actor = getActor(ctx, e);
		const thisActorBase: BaseActorRef<TEvent> = { send };

		actor.send(subscribe(thisActorBase, events));

		onReceive((e) => actor.send(e));

		return () => {
			actor.send(unsubscribe(thisActorBase));
		};
	};
}
