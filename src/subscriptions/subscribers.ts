import type { AnyEventObject, EventObject, BaseActorRef } from "xstate";
import { is } from "../utils/mod";
import { BucketMap } from "./bucket_map";
import type {
	EventMatch,
	SubEvent,
	SubscribeEvent,
	UnsubscribeEvent,
} from "./events";
import { getAllWildcards } from "./wildcard";

export type SubscriberMap<E extends EventObject> = BucketMap<
	EventMatch<E>,
	BaseActorRef<AnyEventObject>
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
): event is SubEvent<E> {
	if (is<SubscribeEvent<E>>("xsystem.subscribe", event)) {
		for (const type of event.matches) subscribers.add(type, event.ref);

		return true;
	}

	if (is<UnsubscribeEvent>("xsystem.unsubscribe", event)) {
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
