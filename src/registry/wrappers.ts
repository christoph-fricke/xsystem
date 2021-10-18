import type { ActorRef, AnyEventObject, BaseActorRef } from "xstate";
import { toEventObject } from "xstate/lib/utils";
import {
	RegisterResponseEvent,
	registerRequest as registerRequest,
} from "./events";
import type { Registry } from "./registry";

/** Registers an actor reference in the given registry. Resolves to true if the registration is successful. */
export function register(
	registry: Registry,
	actor: ActorRef<AnyEventObject, unknown>
): Promise<boolean> {
	return new Promise((resolve) => {
		const origin: BaseActorRef<RegisterResponseEvent> = {
			send: (e) => {
				const event = toEventObject(e);
				if (event.state !== "success") resolve(false);
				else resolve(true);
			},
		};
		registry.send(registerRequest(actor, origin));
	});
}

/** Query the given registry for an actor with the given ID and returns it. */
export function query<A extends ActorRef<AnyEventObject, unknown>>(
	registry: Registry,
	id: string
): A | undefined {
	return registry.getSnapshot()?.get(id) as A | undefined;
}
