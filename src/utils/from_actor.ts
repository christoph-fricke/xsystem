import { ActorRef, AnyEventObject, EventObject, InvokeCreator } from "xstate";
import type { EventMatch, SubEvent } from "../subscriptions/events";
import { subscribe, unsubscribe } from "../subscriptions/events";

type SubscribeAble<
	P extends EventObject,
	Actor = ActorRef<AnyEventObject>
> = Actor extends ActorRef<infer E, infer S>
	? ActorRef<E | SubEvent<P>, S>
	: never;

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<TContext, TEvent extends EventObject>(
	getActor: (ctx: TContext, e: TEvent) => SubscribeAble<TEvent>,
	matches?: EventMatch<TEvent>[]
): InvokeCreator<TContext, TEvent> {
	return (ctx, e) => (send, onReceive) => {
		const actor = getActor(ctx, e);
		const thisBaseActor = { send };

		actor.send(subscribe(thisBaseActor, matches));

		onReceive((e) => actor.send(e));

		return () => {
			actor.send(unsubscribe(thisBaseActor));
		};
	};
}
