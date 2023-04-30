import type { ActorContext, Behavior, EventObject } from "xstate";
import { is } from "../utils/mod";

/** Special type of behavior that can transition to a promise with state `S` as well. */
export type AsyncBehavior<E extends EventObject, S> = {
	transition: (
		state: S,
		event: E,
		actorCtx: ActorContext<E, S>
	) => Promise<S> | S;
	initialState: S;
	start?: (actorCtx: ActorContext<E, S>) => Promise<S> | S;
};

type ResolvedEvent<S> = { type: "xsystem.internal.resolved"; state: S };
const resolved = <S>(state: S): ResolvedEvent<S> => ({
	type: "xsystem.internal.resolved",
	state,
});

type RejectedEvent<S> = { type: "xsystem.internal.rejected"; state: S };
const rejected = <S>(state: S): RejectedEvent<S> => ({
	type: "xsystem.internal.rejected",
	state,
});
type WithEvents<E extends EventObject, S> =
	| E
	| ResolvedEvent<S>
	| RejectedEvent<S>;

export type AsyncStatus = "resolving" | "resolved" | "rejected";
type WithStatus<S> = {
	state: S;
	status: AsyncStatus;
};

export type WithAsync<B> = B extends AsyncBehavior<infer E, infer S>
	? Behavior<WithEvents<E, S>, WithStatus<S>>
	: never;

/**
 * Wraps {@link AsyncBehavior}s to handle `Promises` that can be returned by their transitions.
 * The new behavior wraps the state with an additional flag containing the current state of the
 * promise resolution&nbsp;-&nbsp;corresponding to `resolving`, `resolved`, or `rejected`.
 *
 * While a promise is resolving, the previously resolved state is returned.
 *
 * When a new event is received while a promise is still not resolved, the previous
 * promise is ignored and will no longer be handled by the async behavior.
 * */
export function withAsync<E extends EventObject, S>(
	behavior: AsyncBehavior<E, S>
): WithAsync<typeof behavior> {
	let controller = renewController();
	return {
		initialState: withStatus(behavior.initialState, "resolved"),
		start: (ctx) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const state = behavior.start?.(ctx as any);
			if (!state) return withStatus(behavior.initialState, "resolved");

			controller = renewController(controller);
			return resolve(
				state,
				behavior.initialState,
				ctx.self.send,
				controller.signal
			);
		},
		transition: (state, event, ctx) => {
			if (is<ResolvedEvent<S>>("xsystem.internal.resolved", event)) {
				if (state.status !== "resolving") return state;
				return withStatus(event.state, "resolved");
			}
			if (is<RejectedEvent<S>>("xsystem.internal.rejected", event)) {
				if (state.status !== "resolving") return state;
				return withStatus(event.state, "rejected");
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const next = behavior.transition(state.state, event, ctx as any);
			controller = renewController(controller);
			return resolve(next, state.state, ctx.self.send, controller.signal);
		},
	};
}

function renewController(controller?: AbortController): AbortController {
	if (controller) controller.abort();
	return new AbortController();
}

function withStatus<S>(state: S, status: AsyncStatus): WithStatus<S> {
	return { state, status };
}

function resolve<S>(
	promiseOrState: Promise<S> | S,
	fallback: S,
	sendSelf: (e: ResolvedEvent<S> | RejectedEvent<S>) => void,
	signal: AbortSignal
): WithStatus<S> {
	if (!(promiseOrState instanceof Promise)) {
		return withStatus(promiseOrState, "resolved");
	}

	promiseOrState.then(
		(state) => {
			if (signal.aborted) return;
			sendSelf(resolved(state));
		},
		() => {
			if (signal.aborted) return;
			sendSelf(rejected(fallback));
		}
	);

	return withStatus(fallback, "resolving");
}
