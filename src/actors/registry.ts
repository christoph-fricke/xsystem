import {
	ActorRef,
	ActorRefFrom,
	BaseActorRef,
	Behavior,
	EventObject,
} from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { is } from "../utils/is_event";

// TODO: The registry should be able to resolve actors for actors that run in a
// web-worker or other isolated contexts. It should support the creation of an
// actor system where developers doesn't have to care about runtime contexts for actors.
// **How can we solve this?** Related work: https://github.com/ChrisShank/xstate-behaviors
//
// What if the registry would be able to spawn actors in web-workers etc and inject
// itself so the spawned actor can access actors from other contexts?

/**
 * Extension of an {@link ActorRef} that makes quering the registry a bit more ergonomic.
 * Under the hood, messages are used, which may help to solve the above todo.
 */
interface Registry extends ActorRefFrom<typeof registryBehavior> {
	get<A extends ActorRef<EventObject, unknown>>(
		id: string
	): Promise<A | undefined>;
	register<A extends ActorRef<EventObject, unknown>>(actor: A): void;
	spawn<E extends EventObject, S>(
		id: string,
		behavior: Behavior<E, S>
	): ActorRefFrom<typeof behavior>;
}

export function createRegistry(id: string): Registry {
	const registry = spawnBehavior(registryBehavior(), { id: id });
	const ids = requestId();

	return {
		...registry,
		get<A extends ActorRef<EventObject, unknown>>(
			id: string
		): Promise<A | undefined> {
			return new Promise((resolve) => {
				// A requestId is used in case an actor requests multiple ids rapidly.
				const requestId = ids.next().value;
				registry.send(<RequestEvent>{
					type: "xsystem.registry.request",
					id,
					requestId,
					requestor: {
						send: (event) => {
							if (event.requestId === requestId) resolve(event.ref as A);
						},
					},
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
		spawn(id, behavior) {
			const actor = spawnBehavior(behavior, { id, parent: registry });
			registry.send(<RegisterEvent>{
				type: "xsystem.registry.register",
				ref: actor,
			});
			return actor;
		},
	};
}

function registryBehavior(): Behavior<
	RequestEvent | RegisterEvent,
	Map<string, ActorRef<EventObject, unknown>>
> {
	return {
		initialState: new Map(),
		transition(state, event) {
			if (is<RequestEvent>("xsystem.registry.request", event)) {
				event.requestor.send(<ResponseEvent>{
					type: "xsystem.registry.response",
					requestId: event.requestId,
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
	requestId: number;
	requestor: BaseActorRef<ResponseEvent>;
}

interface ResponseEvent extends EventObject {
	type: "xsystem.registry.response";
	requestId: number;
	ref?: ActorRef<EventObject, unknown>;
}

interface RegisterEvent extends EventObject {
	type: "xsystem.registry.register";
	ref: ActorRef<EventObject, unknown>;
}

/** Generates new request ids which wrap around after the limit is reached. */
function* requestId(limit = 10_000) {
	let next = 0;
	while (true) {
		yield next;
		next = (next + 1) % limit;
	}
}
