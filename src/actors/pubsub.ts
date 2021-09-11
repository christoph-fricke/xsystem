import { ActorContext, Behavior, EventObject } from "xstate";
import { WithSubscriptions, createSubscriptions, is } from "../core/mod";

interface PublishEvent<E extends EventObject> extends EventObject {
	type: "xsystem.publish";
	event: E;
}

/** Higher Order Behavior (HOB) to wrap a given {@link Behavior} with event subscription functionality. */
export type WithPubSub<B> = B extends Behavior<infer E, infer S>
	? Behavior<WithSubscriptions<E>, S>
	: never;

/**
 * Add Pub/Sub behavior to a given {@link Behavior}.
 * Other actors are able to subscribe and unsubscribe to events published by
 * the wrapped {@link Behavior}.
 *
 * To publish an event, a {@link Behavior} should send itself an {@link PublishEvent}
 * with the provided {@link publish} function.
 */
export function withPubSub<E extends EventObject, S>(
	behavior: Behavior<E, S>
): WithPubSub<typeof behavior> {
	const subscribers = createSubscriptions<E>();

	return {
		...behavior,
		// Try to hide the publish event as semi internal so it is not always suggested
		// to the outside.
		transition: (state, event: WithSubscriptions<E> | PublishEvent<E>, ctx) => {
			if (subscribers.handle(event)) return state;

			if (is<PublishEvent<E>>("xsystem.publish", event)) {
				subscribers.publish(event.event);
				return state;
			}

			return behavior.transition(state, event, ctx);
		},
	};
}

/**
 * Send a publish event to itself using the provided actor context. If the behavior
 * is wrapped with the HOB {@link withPubSub}, the publish event will be handled and the
 * provided event will be sent to all subscribers.
 */
export function publish<E extends EventObject, S>(
	ctx: ActorContext<E, S>,
	event: E
): void {
	(ctx as ActorContext<E | PublishEvent<E>, S>).self.send({
		type: "xsystem.publish",
		event,
	});
}
