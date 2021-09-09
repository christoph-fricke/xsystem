import { ActorRef, AnyEventObject, EventObject, InvokeCreator } from "xstate";
import { BaseActorRef } from "../utils/types";
import {
	subscribe,
	unsubscribe,
	EventType,
	WithSubscriptions,
} from "./subscribe_events";

type SubscribeAble<
	E extends EventObject,
	Actor = ActorRef<E>
> = Actor extends ActorRef<E, infer S>
	? ActorRef<WithSubscriptions<E>, S>
	: never;

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<
	TContext,
	TEvent extends EventObject = AnyEventObject
>(
	getActor: (ctx: TContext, e: TEvent) => SubscribeAble<TEvent>,
	events?: EventType<TEvent>[]
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
