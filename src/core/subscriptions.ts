import { BaseActorRef, EventObject, ActionObject } from "xstate";
import { is } from "./event_predicates";
import { BucketMap } from "../utils/bucket_map";
import {
	EventType,
	SubscribeEvent,
	UnsubscribeEvent,
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

/** Create subscription handling that can be used in a `Behavior`. */
export function createSubscriptions<
	E extends EventObject
>(): SubscriptionExtension<E> {
	const subscribers = new BucketMap<EventType<E>, BaseActorRef<E>>();

	return {
		get subscribers() {
			return subscribers.values();
		},
		handle(event): event is SubEvents<E> {
			if (is<SubscribeEvent<E>>("xsystem.subscribe", event)) {
				for (const type of event.events) subscribers.add(type, event.ref);

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

interface SubscriptionMachineExtension<E extends EventObject> {
	/** Returns an {@link IterableIterator} of all subscribed actors. */
	subscribers: IterableIterator<BaseActorRef<E>>;
	/**
	 * Event handling which should be spread in an `on` property of the machine
	 * config, so it handles subscribe events
	 */
	eventHandling: {
		"xsystem.subscribe": unknown;
		"xsystem.unsubscribe": unknown;
	};
	/** Creates an action that publishes an event to all subscribers. */
	publish<TContext, TEevent extends EventObject>(
		event: E
	): ActionObject<TContext, TEevent>;
}

/**
 * Create subscription handling that can be used in a `MachineConfig`.
 * 
 * TODO: _While this works at runtime, it still has TypeScript problems and might be
 * executed in a more elegant way. Also the naming is kinda annoying..._
 *
 * Usage example:
 * ```ts
 * import { createMachine } from "xstate";
 * import { createSubscriptionsConfig, WithSubscriptions } from "xsystem";
 * 
 * export type Event = { type: "ping" } | { type: "pong" };
 * 
 * interface Context {}
 * 
 * export function createPubMachine() {
 *   const subs = createSubscriptionsConfig<Event>();
 * 
 *   return createMachine<Context, WithSubscriptions<Event>>({
 *     id: "ping",
 *     on: {
 *       ...subs.eventHandling,
 *       ping: {
 *         actions: [subs.publish({ type: "pong" })],
 *       },
 *     },
 *   });
 * }
 * ```
 */
export function createSubscriptionsConfig<
	TEevent extends EventObject
>(): SubscriptionMachineExtension<TEevent> {
	const subscriptions = createSubscriptions<TEevent>();

	return {
		subscribers: subscriptions.subscribers,
		eventHandling: {
			"xsystem.subscribe": {
				actions: [
					{
						type: "xsystem.subscribe",
						exec: (_: unknown, e: SubscribeEvent<TEevent>) => {
							subscriptions.handle(e);
						},
					},
				],
			},
			"xsystem.unsubscribe": {
				actions: [
					{
						type: "xsystem.unsubscribe",
						exec: (_: unknown, e: UnsubscribeEvent<TEevent>) => {
							subscriptions.handle(e);
						},
					},
				],
			},
		},
		publish(event) {
			return {
				type: "xsystem.publish",
				exec: () => {
					subscriptions.publish(event);
				},
			};
		},
	};
}
