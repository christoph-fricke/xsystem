import type {
	AnyEventObject,
	Behavior,
	Event,
	EventObject,
	ActorContext,
	ActorRef,
} from "xstate";
import { toActorRef } from "xstate/lib/Actor";
import type { BaseActorRef } from "../utils/mod";

/** Creates a minimal subscriber and exposes the mocked send function. */
export function createMockSubscriber<E extends EventObject>(): [
	jest.Mock<void, [Event<E>]>,
	BaseActorRef<E>
] {
	const handler = jest.fn();
	const subscriber = { send: handler };

	return [handler, subscriber];
}

/** Creates a minimal actor ref with and exposes the mocked send function. */
export function createMockActor<
	E extends EventObject = AnyEventObject,
	S = null
>(): [jest.Mock<void, [Event<E>]>, ActorRef<E, S>] {
	const send = jest.fn();
	const actor = toActorRef({ send });
	return [send, actor];
}

/** Creates a minimal function and exposes the mocked transition function. */
export function createMockBehavior<
	E extends EventObject = AnyEventObject,
	S = null
>(
	initialState: S | null = null
): [jest.Mock<S, [S, E, ActorContext<E, S>]>, Behavior<E, S | null>] {
	const handler = jest.fn();
	const behavior = {
		initialState,
		transition: handler,
	};

	return [handler, behavior];
}
