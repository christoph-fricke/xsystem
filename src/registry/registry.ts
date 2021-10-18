import type { ActorRef, ActorRefFrom, AnyEventObject, Behavior } from "xstate";
import { is } from "../utils/mod";
import { RegisterEvent, registerResponse } from "./events";

export type RegistryState = Map<string, ActorRef<AnyEventObject, unknown>>;
export type RegistryEvent = RegisterEvent;

export type RegistryBehavior = Behavior<RegistryEvent, RegistryState>;
export type Registry = ActorRefFrom<RegistryBehavior>;

export function createRegistry(): RegistryBehavior {
	return {
		initialState: new Map(),
		transition: (state, event) => {
			if (is<RegisterEvent>("xsystem.registry.register", event)) {
				if (state.has(event.actor.id)) {
					event.origin?.send(registerResponse("already_exists"));
					return state;
				}

				state.set(event.actor.id, event.actor);
				event.origin?.send(registerResponse("success"));

				return state;
			}

			return state;
		},
	};
}
