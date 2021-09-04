import { Behavior, EventObject } from "xstate";
import { WithSubscriptions, createSubscriptions } from "../core/mod";
import { createBroadcastChannel } from "../utils/broadcast_channel";

type EventBus<E extends EventObject> = Behavior<WithSubscriptions<E>, null>;

declare global {
	var _xsystem_tabId: number | undefined;
}

interface CreateOptions {
	/**
	 * Defines the communication strategy of the created {@link EventBus}.
	 * - **direct**: Directly calls the different observers for an event.
	 * - **global-broadcast**: Extension of **direct** that broadcasts the event as well via a {@link BroadcastChannel}.
	 * - **broadcast**: Similar to **global-broadcast** but applies additional filtering to stay within a browser tab.
	 */
	strategy: "direct" | "global-broadcast" | "broadcast";
}

export function createEventBus<E extends EventObject>(
	options?: Partial<CreateOptions>
): EventBus<E> {
	if (options?.strategy === "global-broadcast") {
		return globalBroadcastBusBehavior();
	}

	if (options?.strategy === "broadcast") {
		if (typeof globalThis._xsystem_tabId === "undefined") {
			globalThis._xsystem_tabId = Math.floor(Math.random() * 1_000_000);
		}
		return broadcastBusBehavior(globalThis._xsystem_tabId);
	}

	return busBehavior();
}

function busBehavior<E extends EventObject>(): EventBus<E> {
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

function globalBroadcastBusBehavior<E extends EventObject>(): EventBus<E> {
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
	tabId: number;
	event: E;
}

function broadcastBusBehavior<E extends EventObject>(
	tabId: number
): EventBus<E> {
	const subscriptions = createSubscriptions<E>();
	let channel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			if (subscriptions.handle(event)) return state;

			subscriptions.publish(event);
			channel.postMessage(<WrappedBroadcastEvent<E>>{ tabId, event });

			return state;
		},
		start(ctx) {
			channel = createBroadcastChannel(ctx.id);
			channel.onmessage = (msg) =>
				msg.data.tabId === tabId ? subscriptions.publish(msg.data.event) : void 0;
			channel.onmessageerror = (msg) =>
				ctx.observers.forEach((obs) => obs.error(msg));

			return null;
		},
	};
}
