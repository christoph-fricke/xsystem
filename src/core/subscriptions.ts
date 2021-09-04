import { BaseActorRef, EventObject } from "xstate";
import { is } from "./event_predicates";
import { BucketMap } from "../utils/bucket_map";
import {
	EventType,
	SubscribeEvent,
	UnsubscribeEvent,
	WithSubscriptions,
	SubEvents,
} from "./subscribe_events";

interface SubscriptionExtension<E extends EventObject> {
	/** Returns an {@link IterableIterator} of all subscribed actors. */
	subscribers: IterableIterator<BaseActorRef<E>>;

	/**
	 * Handle {@link SubscribeEvent}s and {@link UnsubscribeEvent}s.
	 * @returns `true` if an event has been handled by this extension.
	 */
	handle(event: EventObject): event is SubEvents<E>;

	/** Publish an event to all actors that subscribed to that event. */
	publish(event: E): void;
}

export function createSubscriptions<
	E extends EventObject
>(): SubscriptionExtension<E> {
	const subscribers = new BucketMap<EventType<E>, BaseActorRef<E>>();

	return {
		subscribers: subscribers.values(),
		handle(event): event is SubEvents<E> {
			if (is<SubscribeEvent<E>>("xsystem.subscribe", event)) {
				for (const type of event.eventTypes ?? ["*"])
					subscribers.add(type, event.ref);

				return true;
			}

			if (is<UnsubscribeEvent<E>>("xsystem.unsubscribe", event)) {
				subscribers.delete(event.ref);

				return true;
			}

			return false;
		},
		publish(event) {
			for (const subscriber of subscribers.values(event.type))
				subscriber.send(event);

			for (const subscriber of subscribers.values("*")) subscriber.send(event);
		},
	};
}
