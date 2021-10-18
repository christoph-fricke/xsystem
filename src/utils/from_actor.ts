import type { ActorRef, EventObject, InvokeCreator } from "xstate";
import type { EventMatch, SubEvent } from "../subscriptions/events";
import { subscribe, unsubscribe } from "../subscriptions/events";

type ActorRefResolver<C, E extends EventObject, P extends EventObject> =
	| ActorRef<SubEvent<P>, unknown>
	| ((ctx: C, e: E) => ActorRef<SubEvent<P>, unknown>);

/** Creates an invoke callback that subscribes to the events published by a given actor. */
export function fromActor<C, E extends EventObject, P extends EventObject>(
	actor: ActorRefResolver<C, E, P>,
	matches?: EventMatch<P>[]
): InvokeCreator<C, E> {
	return (ctx, e) => (send, onReceive) => {
		const actorRef = typeof actor === "function" ? actor(ctx, e) : actor;
		const thisBaseActor = { send };

		actorRef.send(subscribe(thisBaseActor, matches));

		onReceive((e) => actorRef.send(e));

		return () => {
			actorRef.send(unsubscribe(thisBaseActor));
		};
	};
}
