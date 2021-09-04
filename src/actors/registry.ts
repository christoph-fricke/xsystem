import { ActorRef, BaseActorRef, Behavior, EventObject } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { is } from "../core";

interface Registry extends ActorRef<any, any> {
	get<A extends ActorRef<any, any>>(id: string): Promise<A | undefined>;
	register<A extends ActorRef<any, any>>(actor: A): void;
}

export function createRegistry(id: string): Registry {
	const registry = spawnBehavior(registryBehavior(), { id: id });

	return {
		...registry,
		get<A extends ActorRef<any, any>>(id: string): Promise<A | undefined> {
			return new Promise((resolve) => {
				registry.send(<RequestEvent>{
					type: "xsystem.registry.request",
					id,
					requestor: { send: (event) => resolve(event.ref as A) },
				});

				resolve(undefined);
			});
		},
		register(actor) {
			registry.send(<RegisterEvent>{
				type: "xsystem.registry.register",
				ref: actor,
			});
		},
	};
}

// TODO: How does this work between contexts. Ref requested from inside an worker etc?

function registryBehavior(): Behavior<
	RequestEvent | RegisterEvent,
	Map<string, ActorRef<any, any>>
> {
	return {
		initialState: new Map(),
		transition(state, event) {
			if (is<RequestEvent>("xsystem.registry.request", event)) {
				event.requestor.send(<ResponseEvent>{
					type: "xsystem.registry.response",
					ref: state.get(event.id),
				});
				return state;
			}

			if (is<RegisterEvent>("xsystem.registry.register", event)) {
				state.set(event.ref.id, event.ref);
				return state;
			}

			return state;
		},
	};
}

interface RequestEvent extends EventObject {
	type: "xsystem.registry.request";
	id: string;
	requestor: BaseActorRef<ResponseEvent>;
}

interface ResponseEvent extends EventObject {
	type: "xsystem.registry.response";
	ref?: ActorRef<any, any>;
}

interface RegisterEvent extends EventObject {
	type: "xsystem.registry.register";
	ref: ActorRef<any, any>;
}
