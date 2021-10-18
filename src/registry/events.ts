import type {
	ActorRef,
	AnyEventObject,
	EventObject,
	BaseActorRef,
} from "xstate";

export interface RegisterEvent extends EventObject {
	type: "xsystem.registry.register";
	actor: ActorRef<AnyEventObject, unknown>;
	origin?: BaseActorRef<RegisterResponseEvent>;
}

export function registerRequest(
	actor: RegisterEvent["actor"],
	origin?: RegisterEvent["origin"]
): RegisterEvent {
	return {
		type: "xsystem.registry.register",
		actor,
		origin,
	};
}

export interface RegisterResponseEvent extends EventObject {
	type: "xsystem.registry.register.response";
	state: "success" | "already_exists" | "failed";
}

export function registerResponse(
	state: RegisterResponseEvent["state"]
): RegisterResponseEvent {
	return {
		type: "xsystem.registry.register.response",
		state,
	};
}
