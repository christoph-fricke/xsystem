import {
	BaseActorRef as BuggedBaseActorRef,
	EventObject,
	Sender,
} from "xstate";

/**
 * The send function of an `ActorRef` is a {@link Sender}, meaning it accepts
 * strings as events, whereas {@link BaseActorRef} only accepts {@link EventObject}s.
 */
export interface BaseActorRef<E extends EventObject>
	extends BuggedBaseActorRef<E> {
	send: Sender<E>;
}

/** Construct event objects from a union of event strings. */
export type FromEventTypes<T extends string> = { type: T };
