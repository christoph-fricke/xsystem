import { ActorRef, AnyEventObject, EventObject } from "xstate";
import { BaseActorRef } from "../utils/mod";

export interface RegisterEvent extends EventObject {
	type: "xsystem.registry.register";
	actor: ActorRef<AnyEventObject, unknown>;
	origin?: BaseActorRef<RegisterResponseEvent>;
}

export function register(
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

export interface QueryEvent extends EventObject {
	type: "xsystem.registry.query";
	id: string;
	origin: BaseActorRef<QueryResponseEvent>;
}

export function query(id: string, origin: QueryEvent["origin"]): QueryEvent {
	return {
		type: "xsystem.registry.query",
		id,
		origin,
	};
}

export interface QueryResponseEvent extends EventObject {
	type: "xsystem.registry.query.response";
	state: "found" | "notfound";
	actor?: ActorRef<AnyEventObject, unknown>;
}

export function queryResponse(
	state: QueryResponseEvent["state"],
	actor: QueryResponseEvent["actor"]
): QueryResponseEvent {
	return {
		type: "xsystem.registry.query.response",
		state,
		actor,
	};
}
