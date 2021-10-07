import type { ActionObject, Behavior, EventObject } from "xstate";
import type { SubEvent, Publish } from "../subscriptions/mod";
import {
	createSubscriberStructure,
	createPublishFunction,
	handleSubscribeEvent,
} from "../subscriptions/mod";

/** Higher Order Behavior (HOB) to wrap a given {@link Behavior} with event subscription functionality. */
export type WithPubSub<P extends EventObject, B> = B extends Behavior<
	infer E,
	infer S
>
	? Behavior<E | SubEvent<P>, S>
	: never;

/**
 * Add Pub/Sub behavior to a given {@link Behavior}.
 * Other actors are able to subscribe and unsubscribe to events published by
 * the wrapped {@link Behavior}.
 *
 * To publish an event, a {@link Behavior} should send itself an {@link PublishEvent}
 * with the provided {@link publish} function.
 */
export function withPubSub<P extends EventObject, E extends EventObject, S>(
	getBehavior: (publish: Publish<P>) => Behavior<E, S>
): WithPubSub<P, Behavior<E, S>> {
	const subscribers = createSubscriberStructure<P>();
	const behavior = getBehavior(createPublishFunction(subscribers));

	return {
		...behavior,
		transition: (state, event, ctx) => {
			if (handleSubscribeEvent(subscribers, event)) return state;

			return behavior.transition(state, event, ctx);
		},
	};
}

/**
 * Create an action that publishes the given event. If the machine
 * is wrapped with the HOB {@link withPubSub}, the publish event will be handled and the
 * provided event will be sent to all subscribers.
 */
export function createPublishAction<P extends EventObject>(
	publish: Publish<P>
) {
	return function publishAction<C, E extends EventObject>(
		event: P
	): ActionObject<C, E> {
		return {
			type: "publish",
			exec: () => publish(event),
		};
	};
}
