import { Behavior, EventObject, ActorRefFrom, ActorRef } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { createSubscriptions } from "../core/subscriptions";
import { WithSubscriptions } from "../core";
import { createBroadcastChannel } from "../utils/broadcast_channel";

type EventBus<E extends EventObject> = Behavior<WithSubscriptions<E>, null>;

interface CreateOptions {
	/**
	 * Defines the communication strategy of the created {@link EventBus}.
	 * - **direct**: Directly calls the different observers for an event.
	 * - **broadcast**: Extension of **direct** that broadcasts the event as well via a {@link BroadcastChannel}.
	 */
	strategy: "direct" | "global-broadcast";
	parent: ActorRef<any, any>;
}

export function createEventBus<E extends EventObject>(
	id: string,
	options?: Partial<CreateOptions>
): ActorRefFrom<EventBus<E>> {
	if (options?.strategy === "global-broadcast") {
		return spawnBehavior(globalBroadcastBusBehavior(), {
			id,
			parent: options.parent,
		});
	}

	return spawnBehavior(busBehavior(), { id, parent: options?.parent });
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
