import {
	Behavior,
	EventObject,
	State,
	StateMachine,
	Typestate,
	interpret,
	Interpreter,
	AnyInterpreter,
} from "xstate";

/**
 * Creates a {@link Behavior} from a given machine. This makes the machine
 * composable with higher order behavior, e.g. `withPubSub`.
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
	let service: Interpreter<C, S, E, TS> | undefined;

	// TODO: Stop machines once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: machine.initialState,
		transition: (state, event) => {
			return service?.send(event) ?? state;
		},
		start: (ctx) => {
			service = interpret(machine, {
				...options,
				parent: ctx.self as AnyInterpreter,
				id: ctx.id
			});
			service.start();

			return service.getSnapshot();
		},
	};
}
