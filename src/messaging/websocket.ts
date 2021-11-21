import type { ActorContext, Behavior, EventObject } from "xstate";
import type { Publish } from "../subscriptions/mod";
import { is } from "../utils/mod";
import type { WithPubSub } from "./pub_sub";
import { withPubSub } from "./pub_sub";

/** @internal Notifies the spawned actor about a state change in the socket. */
interface StateChangeEvent extends EventObject {
	type: "xsystem.websocket.internal.state_change";
}

interface WebSocketState {
	status: "open" | "closed" | "closing" | "connecting";
	queue: string[];
}

interface WebSocketOptions<P extends EventObject> {
	/** Optional filter to only publish events from the WebSocket if they pass the filter. */
	filter: (event: P) => boolean;
}

// TODO: (#3) Requires support for "stop" behavior to close the socket connection.

/**
 * Creates an {@link Behavior} that wraps and manages a {@link WebSocket} connection.
 * The state of spawned actors is not managed explicitly. Instead, it is derived
 * from the WebSocket's `readyState` to enure that it reflects the real WebSocket
 * connection state.
 */
export function createWebSocket<E extends EventObject, P extends EventObject>(
	getWebSocket: () => WebSocket,
	options?: Partial<WebSocketOptions<P>>
): WithPubSub<P, Behavior<E | StateChangeEvent, WebSocketState>> {
	const initialState: WebSocketState = {
		status: "connecting",
		queue: [],
	};
	let socket: WebSocket;

	return withPubSub((publish) => ({
		initialState,
		transition: (state, event) => {
			if (
				is<StateChangeEvent>("xsystem.websocket.internal.state_change", event)
			) {
				// Empty the queue if the socket opened.
				if (socket.readyState === socket.OPEN) {
					for (const msg of state.queue) socket.send(msg);
					return nextState(socket, []);
				}

				return nextState(socket, state.queue);
			}

			const eventToSend = JSON.stringify(event);

			if (socket.readyState !== socket.OPEN) {
				// Sending an event while the WebSocket is not open would raise an error.
				return nextState(socket, state.queue.concat(eventToSend));
			} else if (state.queue.length > 0) {
				for (const msg of state.queue.concat(eventToSend)) socket.send(msg);
				return nextState(socket, []);
			} else {
				socket.send(eventToSend);
				return nextState(socket, state.queue);
			}
		},
		start: (ctx) => {
			socket = getWebSocket();

			socket.onopen = createStateChangeHandler(ctx);
			socket.onclose = createStateChangeHandler(ctx);
			socket.onmessage = createPublishMessage(publish, options);
			socket.onerror = (e) => ctx.observers.forEach((obs) => obs.error(e));

			return nextState(socket, []);
		},
	}));
}

function nextState(socket: WebSocket, queue: string[]): WebSocketState {
	switch (socket.readyState) {
		case socket.CONNECTING:
			return { status: "connecting", queue };
		case socket.OPEN:
			return { status: "open", queue };
		case socket.CLOSING:
			return { status: "closing", queue };
		case socket.CLOSED:
			return { status: "closed", queue };
		default:
			throw new TypeError("Unknown ready state for WebSocket connection.");
	}
}

function createStateChangeHandler(
	ctx: ActorContext<StateChangeEvent, WebSocketState>
): () => void {
	return () =>
		ctx.self.send({ type: "xsystem.websocket.internal.state_change" });
}

function createPublishMessage<P extends EventObject>(
	publish: Publish<P>,
	options?: Partial<WebSocketOptions<P>>
): (msg: MessageEvent<unknown>) => void {
	return (msg) => {
		let event: P;
		try {
			event = JSON.parse(msg.data as string);
			if (typeof event !== "object" || typeof event.type !== "string")
				throw new Error("Message is not an event!");
		} catch {
			return;
		}

		// "=== false" might look "dump" but the case should only be taken if the
		// filter returns false. If no filter exists, all events are be published.
		if (options?.filter?.(event) === false) return;

		publish(event);
	};
}
