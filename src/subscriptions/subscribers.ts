import type { AnyEventObject, EventObject } from "xstate";
import { is } from "../utils/is_event";
import type { BaseActorRef } from "../utils/types";
import { BucketMap } from "./bucket_map";
import type {
	EventMatch,
	SubEvent,
	SubscribeEvent,
	UnsubscribeEvent,
} from "./events";
import { getAllWildcards } from "./wildcard";

type SubscriberMap<E extends EventObject> = BucketMap<
	EventMatch<E>,
	BaseActorRef<E | AnyEventObject>
>;

/**
 * Function that should be used to publish an event. Is provided to the
 * extended behavior by the {@link} withPubSub HOB.
 */
export type Publish<E extends EventObject> = (event: E) => void;

export function createSubscriberStructure<
	E extends EventObject
>(): SubscriberMap<E> {
	return new BucketMap();
}

export function handleSubscribeEvent<E extends EventObject>(
	subscribers: SubscriberMap<E>,
	event: AnyEventObject
): event is SubEvent<E, AnyEventObject> {
	if (is<SubscribeEvent<E, AnyEventObject>>("xsystem.subscribe", event)) {
		for (const type of event.events) subscribers.add(type, event.ref);

		return true;
	}

	if (is<UnsubscribeEvent<E, AnyEventObject>>("xsystem.unsubscribe", event)) {
		subscribers.delete(event.ref);

		return true;
	}

	return false;
}

export function createPublishFunction<E extends EventObject>(
	subscribers: SubscriberMap<E>
): Publish<E> {
	return function publish(event) {
		for (const sub of subscribers.values(event.type)) sub.send(event);

		const wildcards = getAllWildcards(".", event.type);
		for (const wildcard of wildcards) {
			for (const sub of subscribers.values(wildcard)) sub.send(event);
		}
	};
}
