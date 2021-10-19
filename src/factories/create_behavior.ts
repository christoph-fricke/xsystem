import type {
	AnyEventObject,
	Behavior,
	EventObject,
	ActorContext,
} from "xstate";
import { EventMatch, getAllWildcards } from "../subscriptions/mod";
import { assertDefined } from "../utils/mod";

type StartCallback<E extends EventObject, S> = (
	ctx: ActorContext<E, S>
) => S | undefined;
type HandlerCallback<E extends EventObject, S> = Behavior<E, S>["transition"];

interface Builder<E extends EventObject, S> {
	initialState(state: S): void;
	start(callback: StartCallback<E, S>): void;
	on(type: EventMatch<E>, handler: HandlerCallback<E, S>): void;
	// compose<Args extends Array<unknown>>(
	// 	hob: (...args: Args) => Behavior<E, S>
	// ): Args;
}

// TODO: Add ability to compose HOB in the factory

export function createBehavior<
	E extends EventObject = AnyEventObject,
	S = undefined
>(factory: (builder: Builder<E, S>) => void): Behavior<E, S> {
	let _initialState: S | undefined;
	let _start: StartCallback<E, S> | undefined;
	const handlers: Map<EventMatch<E>, HandlerCallback<E, S>> = new Map();

	const initialState: Builder<E, S>["initialState"] = (state) => {
		_initialState = state;
	};

	const start: Builder<E, S>["start"] = (callback) => {
		_start = callback;
	};

	const on: Builder<E, S>["on"] = (type, handler) => {
		handlers.set(type, handler);
	};

	// Call the factory to receive the definition for the behavior.
	factory({ initialState, start, on });
	assertDefined(_initialState, "Factory must define an initial state!");

	return {
		initialState: _initialState,
		start: (ctx) => {
			return _start?.(ctx) ?? (_initialState as S);
		},
		transition: (state, event, ctx) => {
			let newState: S = state;
			const wildcards = getAllWildcards(".", event.type);

			for (const type of wildcards) {
				newState = handlers.get(type)?.(newState, event, ctx) ?? newState;
			}

			return handlers.get(event.type)?.(newState, event, ctx) ?? newState;
		},
	};
}