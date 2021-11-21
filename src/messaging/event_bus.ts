import type { ActorRefFrom, Behavior, EventObject } from "xstate";
import { createBroadcastChannel } from "./broadcast_channel";
import { getInstanceID } from "./instance_id";
import type { Publish } from "../subscriptions/mod";
import { withPubSub, WithPubSub } from "./pub_sub";

type BaseBehavior<E extends EventObject> = Behavior<E, null>;

/** {@link ActorRef} that proxies an received event to all subscribed actors. */
export type EventBus<E extends EventObject> = ActorRefFrom<
	WithPubSub<E, BaseBehavior<E>>
>;

type ChannelFactory = (id: string) => BroadcastChannel;

interface CreateOptions {
	/**
	 * Defines the communication strategy of the created event bus behavior.
	 * - **direct**: Default Strategy. Directly calls the different observers for an event.
	 * - **global-broadcast**: Extension of **direct** that also broadcasts the event via a {@link BroadcastChannel}.
	 * - **broadcast**: Similar to **global-broadcast** but applies additional filtering to stay within a browser tab.
	 */
	strategy: "direct" | "global-broadcast" | "broadcast";
	/**
	 * _"Bring your own polyfill!"_ Optional factory function that is used by the
	 * **global-broadcast** and **broadcast** strategy to access a {@link BroadcastChannel}.
	 * The provided `id` should be used as a channel name.
	 *
	 * If no factory function is provided, the native API will be used when available.
	 * If not available, it falls back to an no-op implementation of {@link BroadcastChannel},
	 * which will continue to deliver events in the same browser context.
	 */
	channel: ChannelFactory;
}

/** Create the {@link Behavior} for an {@link EventBus}, which can be spawned. */
export function createEventBus<E extends EventObject>(
	options?: Partial<CreateOptions>
): WithPubSub<E, BaseBehavior<E>> {
	let strategy: (pub: Publish<E>) => BaseBehavior<E>;

	switch (options?.strategy) {
		case "broadcast":
			strategy = (pub) =>
				broadcastBusBehavior(getInstanceID(), pub, options.channel);
			break;
		case "global-broadcast":
			strategy = (pub) => globalBroadcastBusBehavior(pub, options.channel);
			break;
		default:
			strategy = busBehavior;
			break;
	}

	return withPubSub(strategy);
}

function busBehavior<E extends EventObject>(
	publish: Publish<E>
): BaseBehavior<E> {
	return {
		initialState: null,
		transition(state, event) {
			publish(event);

			return state;
		},
	};
}

function globalBroadcastBusBehavior<E extends EventObject>(
	publish: Publish<E>,
	channel?: ChannelFactory
): BaseBehavior<E> {
	let bcChannel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			publish(event);
			bcChannel?.postMessage(event);

			return state;
		},
		start(ctx) {
			bcChannel = channel?.(ctx.id) ?? createBroadcastChannel(ctx.id);
			bcChannel.onmessage = (msg) => publish(msg.data);
			bcChannel.onmessageerror = (msg) =>
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
	contextId: number,
	publish: Publish<E>,
	channel?: ChannelFactory
): BaseBehavior<E> {
	let bcChannel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			publish(event);
			bcChannel?.postMessage(<WrappedBroadcastEvent<E>>{ contextId, event });

			return state;
		},
		start(ctx) {
			bcChannel = channel?.(ctx.id) ?? createBroadcastChannel(ctx.id);
			bcChannel.onmessage = (msg) =>
				msg.data.contextId === contextId ? publish(msg.data.event) : void 0;
			bcChannel.onmessageerror = (msg) =>
				ctx.observers.forEach((obs) => obs.error(msg));

			return null;
		},
	};
}
