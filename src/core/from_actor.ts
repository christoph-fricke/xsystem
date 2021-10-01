import { ActorRef, AnyEventObject, EventObject, InvokeCreator } from "xstate";
import type { EventMatch, SubEvent } from "../subscriptions/events";
import { subscribe, unsubscribe } from "../subscriptions/events";
import { BaseActorRef } from "../utils/types";

type SubscribeAble<
	SEvent extends EventObject,
	AEvent extends EventObject,
	Actor = ActorRef<AnyEventObject>
> = Actor extends ActorRef<infer E, infer S>
	? ActorRef<E | SubEvent<SEvent, AEvent>, S>
	: never;

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<TContext, TEvent extends EventObject>(
	getActor: (ctx: TContext, e: TEvent) => SubscribeAble<TEvent, TEvent>,
	events?: EventMatch<TEvent>[]
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
