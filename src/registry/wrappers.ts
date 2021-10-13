import { ActorRef, AnyEventObject } from "xstate";
import { toEventObject } from "xstate/lib/utils";
import { BaseActorRef } from "../utils/mod";
import { RegisterResponseEvent, register } from "./events";
import { Registry } from "./registry";

export function registerActor(
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
		registry.send(register(actor, origin));
	});
}

export function getActor<A extends ActorRef<AnyEventObject, unknown>>(
	registry: Registry,
	id: string
): A | undefined {
	return registry.getSnapshot()?.get(id) as A | undefined;
}
