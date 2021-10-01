import { ActorRefFrom, Behavior, EventObject } from "xstate";
import { createBroadcastChannel } from "../utils/broadcast_channel";
import { getInstanceRandom } from "../utils/identifier";
import { Publish } from "../subscriptions/mod";
import { withPubSub, WithPubSub } from "./pub_sub";

type BaseBehavior<E extends EventObject> = Behavior<E, null>;

/** {@link ActorRef} that proxies an received event to all subscribed actors. */
export type EventBus<E extends EventObject> = ActorRefFrom<
	WithPubSub<E, BaseBehavior<E>>
>;

interface CreateOptions {
	/**
	 * Defines the communication strategy of the created event bus behavior.
	 * - **direct**: Directly calls the different observers for an event.
	 * - **global-broadcast**: Extension of **direct** that broadcasts the event as well via a {@link BroadcastChannel}.
	 * - **broadcast**: Similar to **global-broadcast** but applies additional filtering to stay within a browser tab.
	 */
	strategy: "direct" | "global-broadcast" | "broadcast";
}

/** Create the {@link Behavior} for an {@link EventBus}, which can be spawned. */
export function createEventBus<E extends EventObject>(
	options?: Partial<CreateOptions>
): WithPubSub<E, BaseBehavior<E>> {
	let strategy: (pub: Publish<E>) => BaseBehavior<E>;

	switch (options?.strategy) {
		case "broadcast":
			strategy = (pub) => broadcastBusBehavior(getInstanceRandom(), pub);
			break;
		case "global-broadcast":
			strategy = globalBroadcastBusBehavior;
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
	publish: Publish<E>
): BaseBehavior<E> {
	let channel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			publish(event);
			channel?.postMessage(event);

			return state;
		},
		start(ctx) {
			channel = createBroadcastChannel(ctx.id);
			channel.onmessage = (msg) => publish(msg.data);
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
	contextId: number,
	publish: Publish<E>
): BaseBehavior<E> {
	let channel: BroadcastChannel;

	// TODO: Close the channel once https://github.com/statelyai/xstate/pull/2560 is merged

	return {
		initialState: null,
		transition(state, event) {
			publish(event);
			channel?.postMessage(<WrappedBroadcastEvent<E>>{ contextId, event });

			return state;
		},
		start(ctx) {
			channel = createBroadcastChannel(ctx.id);
			channel.onmessage = (msg) =>
				msg.data.contextId === contextId ? publish(msg.data.event) : void 0;
			channel.onmessageerror = (msg) =>
				ctx.observers.forEach((obs) => obs.error(msg));

			return null;
		},
	};
}
