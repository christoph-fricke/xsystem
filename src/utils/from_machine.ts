import {
	AnyInterpreter,
	Behavior,
	EventObject,
	interpret,
	Interpreter,
	State,
	StateMachine,
	StateSchema,
	Typestate,
} from "xstate";

/**
 * Creates a {@link Behavior} from a given machine. This makes the machine
 * composable with higher order behavior, e.g. `withPubSub`.
 */
export function fromMachine<
	C,
	S extends StateSchema<unknown>,
	E extends EventObject,
	TS extends Typestate<C>
>(
	machine: StateMachine<C, S, E, TS>,
	options?: Parameters<typeof interpret>["1"]
): Behavior<E, State<C, E, S, TS>> {
	let service: Interpreter<C, S, E, TS>;

	// TODO: Stop machines once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: machine.initialState,
		transition: (_, event) => {
			return service.send(event);
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
