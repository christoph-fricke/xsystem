import { ActorRefFrom, Behavior, EventObject } from "xstate";
import { WithSubscriptions, createSubscriptions } from "../core/mod";
import { createBroadcastChannel } from "../utils/broadcast_channel";
import { getInstanceRandom } from "../utils/identifier";

type EventBusBehavior<E extends EventObject> = Behavior<
	WithSubscriptions<E>,
	null
>;

/** {@link ActorRef} that proxies an received event to all subscribed actors. */
export type EventBus<E extends EventObject> = ActorRefFrom<EventBusBehavior<E>>;

interface CreateOptions {
	/**
	 * Defines the communication strategy of the created {@link EventBusBehavior}.
	 * - **direct**: Directly calls the different observers for an event.
	 * - **global-broadcast**: Extension of **direct** that broadcasts the event as well via a {@link BroadcastChannel}.
	 * - **broadcast**: Similar to **global-broadcast** but applies additional filtering to stay within a browser tab.
	 */
	strategy: "direct" | "global-broadcast" | "broadcast";
}

/** Create the {@link Behavior} for an {@link EventBus}, which can be spawned. */
export function createEventBus<E extends EventObject>(
	options?: Partial<CreateOptions>
): EventBusBehavior<E> {
	if (options?.strategy === "global-broadcast") {
		return globalBroadcastBusBehavior();
	}

	if (options?.strategy === "broadcast") {
		return broadcastBusBehavior(getInstanceRandom());
	}

	return busBehavior();
}

function busBehavior<E extends EventObject>(): EventBusBehavior<E> {
	const subscriptions = createSubscriptions<E>();

	return {
		initialState: null,
		transition(state, event) {
			if (subscriptions.handle(event)) return state;

			subscriptions.publish(event);

			return state;
		},
	};
}

function globalBroadcastBusBehavior<
	E extends EventObject
>(): EventBusBehavior<E> {
	const subscriptions = createSubscriptions<E>();
	let channel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			if (subscriptions.handle(event)) return state;

			subscriptions.publish(event);
			channel.postMessage(event);

			return state;
		},
		start(ctx) {
			channel = createBroadcastChannel(ctx.id);
			channel.onmessage = (msg) => subscriptions.publish(msg.data);
			channel.onmessageerror = (msg) =>
				ctx.observers.forEach((obs) => obs.error(msg));

			return null;
		},
	};
}

interface WrappedBroadcastEvent<E extends EventObject> {
	contextId: number;
	event: E;
}

function broadcastBusBehavior<E extends EventObject>(
	contextId: number
): EventBusBehavior<E> {
	const subscriptions = createSubscriptions<E>();
	let channel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			if (subscriptions.handle(event)) return state;

			subscriptions.publish(event);
			channel.postMessage(<WrappedBroadcastEvent<E>>{ contextId, event });

			return state;
		},
		start(ctx) {
			channel = createBroadcastChannel(ctx.id);
			channel.onmessage = (msg) =>
				msg.data.contextId === contextId
					? subscriptions.publish(msg.data.event)
					: void 0;
			channel.onmessageerror = (msg) =>
				ctx.observers.forEach((obs) => obs.error(msg));

			return null;
		},
	};
}
