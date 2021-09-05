import {
	ActorRef,
	AnyEventObject,
	BaseActorRef,
	EventObject,
	InvokeCreator,
} from "xstate";
import {
	subscribe,
	unsubscribe,
	EventType,
	WithSubscriptions,
} from "./subscribe_events";

type SubscribeAble<
	E extends EventObject,
	M extends EventObject = AnyEventObject
> = ActorRef<WithSubscriptions<E, M>>;

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<
	TContext,
	TEvent extends EventObject = AnyEventObject,
	TOtherEvent extends EventObject = AnyEventObject
>(
	getActor: (
		ctx: TContext,
		e: TEvent | TOtherEvent
	) => SubscribeAble<TEvent, TOtherEvent>,
	events?: EventType<TEvent>[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): InvokeCreator<any, any> {
	return (ctx, e) => (send, onReceive) => {
		const actor = getActor(ctx, e);
		const thisActorBase: BaseActorRef<TEvent | TOtherEvent> = { send };

		actor.send(subscribe(thisActorBase, events));

		onReceive((e) => actor.send(e));

		return () => {
			actor.send(unsubscribe(thisActorBase));
		};
	};
}
