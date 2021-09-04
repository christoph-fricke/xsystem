import {
	ActorRef,
	AnyEventObject,
	BaseActorRef,
	EventObject,
	InvokeCreator,
} from "xstate";
import {
	SubEvents,
	subscribe,
	unsubscribe,
	EventType,
} from "./subscribe_events";

type SubscribeAble<
	TEvent extends EventObject,
	TMore extends EventObject
> = ActorRef<SubEvents<TEvent> | TMore>;

// TODO: I might have some generics mixed up. Couldn't fully wrap my head around it yet.

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<
	TContext,
	TEvent extends EventObject = AnyEventObject
>(
	getActor: (ctx: TContext, e: TEvent) => SubscribeAble<TEvent, EventObject>,
	eventTypes: EventType<TEvent>[]
): InvokeCreator<TContext, TEvent> {
	return (ctx, e) => (send, onReceive) => {
		const actor = getActor(ctx, e);
		const thisActorBase: BaseActorRef<TEvent> = { send };

		actor.send(subscribe(thisActorBase, eventTypes));

		onReceive((e) => actor.send(e));

		return () => {
			actor.send(unsubscribe(thisActorBase));
		};
	};
}
