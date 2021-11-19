import type { ActorRef, Behavior, EventObject } from "xstate";
import type { SubEvent, EventMatch } from "../subscriptions/mod";
import { subscribe } from "../subscriptions/mod";

/**
 * HOB that subscribes an actor that is spawned from the given `behavior` to an
 * provided `publisher`. As expected from the pub/sub pattern in _XSystem_,
 * an optional {@link EventMatch}es can be provided to only subscribe
 * to certain events.
 *
 * In the future, spawned actors will be unsubscribed automatically when the
 * required support drops in _XState_.
 */
export function withSubscription<
	E extends EventObject,
	S,
	P extends EventObject
>(
	behavior: Behavior<E, S>,
	publisher: ActorRef<SubEvent<P>, unknown>,
	matches?: EventMatch<P>[]
): Behavior<E, S> {
	// TODO: Unsubscribe behavior when "stop" behavior support is added in XState.

	return {
		...behavior,
		start: (ctx) => {
			publisher.send(subscribe(ctx.self, matches));
			return behavior.start?.(ctx) ?? behavior.initialState;
		},
	};
}
