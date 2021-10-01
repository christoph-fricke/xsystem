import {
	Behavior,
	EventObject,
	State,
	StateMachine,
	Typestate,
	interpret,
	AnyInterpreter
} from "xstate";

/**
 * Creates a {@link Behavior} from a given machine. This makes the machine
 * composable with higher order behavior, e.g. `withPubSub`.
 * 
 * TODO: This function has major TS problems. I don't know why. I can't assign a created machine.
 */
export function fromMachine<
	M extends StateMachine<C, S, E, TS>,
	C,
	S,
	E extends EventObject,
	TS extends Typestate<C>
>(
	machine: M,
	options?: Parameters<typeof interpret>["1"]
): Behavior<E, State<C, E, S, TS>> {
	let service: AnyInterpreter | undefined;

	// TODO: Stop machines once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: machine.initialState,
		transition: (state, event) => {
			return service?.send(event) ?? state;
		},
		start: (ctx) => {
			service = interpret(machine, {
				...options,
				parent: ctx.parent as AnyInterpreter,
				id: ctx.id,
			});
			service.start();

			return service.getSnapshot();
		},
	};
}
