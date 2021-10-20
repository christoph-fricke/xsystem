import type { ActorContext, Behavior, EventObject } from "xstate";
import type { Publish } from "../subscriptions/mod";
import { is } from "../utils/mod";
import type { WithPubSub } from "./pub_sub";
import { withPubSub } from "./pub_sub";

/** @internal Notifies the spawned actor about a state change in the socket. */
interface StateChangeEvent extends EventObject {
	type: "xsystem.websocket.internal.state_change";
}

type WithWebSocket<E extends EventObject> = E | StateChangeEvent;

interface WebSocketBehaviorState {
	status: "open" | "closed" | "closing" | "connecting";
	queue: string[];
}

interface BehaviorOptions<P extends EventObject> {
	/** Optional filter to only publish events from the WebSocket if they pass the filter. */
	filter: (event: P) => boolean;
}

// TODO: (#3) Requires support for "stop" behavior to close the socket connection.

/** Creates an {@link Behavior} that wraps and manages a {@link WebSocket} connection. */
export function createWebSocket<E extends EventObject, P extends EventObject>(
	getWebSocket: () => WebSocket,
	options?: Partial<BehaviorOptions<P>>
): WithPubSub<P, Behavior<WithWebSocket<E>, WebSocketBehaviorState>> {
	const initialState = nextState(WebSocket.CONNECTING, []);
	let socket: WebSocket;

	return withPubSub((publish) => ({
		initialState,
		transition: (state, event) => {
			if (
				is<StateChangeEvent>("xsystem.websocket.internal.state_change", event)
			) {
				// Empty the queue if the socket opened.
				if (socket.readyState === WebSocket.OPEN) {
					for (const msg of state.queue) socket.send(msg);
					return nextState(socket.readyState, []);
				}

				return nextState(socket.readyState, state.queue);
			}

			const eventToSend = JSON.stringify(event);

			if (socket.readyState !== WebSocket.OPEN) {
				// Sending an event while the WebSocket is not open would raise an error.
				return nextState(socket.readyState, state.queue.concat(eventToSend));
			} else if (state.queue.length > 0) {
				for (const msg of state.queue.concat(eventToSend)) socket.send(msg);
				return nextState(socket.readyState, []);
			} else {
				socket.send(eventToSend);
				return nextState(socket.readyState, state.queue);
			}
		},
		start: (ctx) => {
			socket = getWebSocket();

			socket.onopen = createStateChangeHandler(ctx);
			socket.onclose = createStateChangeHandler(ctx);
			socket.onmessage = createPublishMessage(publish, options);
			socket.onerror = (e) => ctx.observers.forEach((obs) => obs.error(e));

			return nextState(socket.readyState, []);
		},
	}));
}

function nextState(
	readyState: number,
	queue: string[]
): WebSocketBehaviorState {
	switch (readyState) {
		case WebSocket.CONNECTING:
			return { status: "connecting", queue };
		case WebSocket.OPEN:
			return { status: "open", queue };
		case WebSocket.CLOSING:
			return { status: "closing", queue };
		case WebSocket.CLOSED:
			return { status: "closed", queue };
		default:
			throw new TypeError("Unknown ready state for WebSocket connection.");
	}
}

function createStateChangeHandler(
	ctx: ActorContext<StateChangeEvent, any> // eslint-disable-line @typescript-eslint/no-explicit-any
): () => void {
	return () =>
		ctx.self.send({ type: "xsystem.websocket.internal.state_change" });
}

function createPublishMessage<P extends EventObject>(
	publish: Publish<P>,
	options?: Partial<BehaviorOptions<P>>
): (msg: MessageEvent<P>) => void {
	return (msg) => {
		let event: P;
		try {
			event = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
		} catch {
			return;
		}

		// "=== false" might look "dump" but the case should only be taken if the
		// filter returns false. If no filter exists, all events are be published.
		if (options?.filter?.(event) === false) return;

		publish(event);
	};
}
