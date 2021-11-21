import { mock } from "jest-mock-extended";
import type { ActorRef, AnyEventObject } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, SubEvent } from "../subscriptions/mod";
import { createWebSocket } from "./websocket";

type AnyActor = ActorRef<SubEvent<AnyEventObject>, unknown>;
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

describe(createWebSocket, () => {
	// Modify `readyState` on this object to change the socket state during testing
	let readyStates: Pick<
		Writeable<WebSocket>,
		"CONNECTING" | "OPEN" | "CLOSING" | "CLOSED" | "readyState"
	>;

	beforeEach(() => {
		readyStates = {
			CONNECTING: 0,
			OPEN: 1,
			CLOSING: 2,
			CLOSED: 3,
			readyState: 0,
		};
	});

	it("should call the provided getter function when the behavior is spawned", () => {
		const socket = mock<WebSocket>(readyStates);
		const getter = jest.fn().mockReturnValue(socket);

		const actor = spawnBehavior(createWebSocket(getter));

		expect(getter).toBeCalledTimes(1);
		expect(actor.getSnapshot()).toStrictEqual({
			status: "connecting",
			queue: [],
		});
	});

	describe("connection state changes", () => {
		it("should be in a connecting state if the socket is connecting", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event = { type: "transition" };

			readyStates.readyState = readyStates.CONNECTING;
			actor.send(event);

			expect(socket.send).not.toBeCalled();
			expect(actor.getSnapshot()).toStrictEqual({
				status: "connecting",
				queue: [JSON.stringify(event)],
			});
		});

		it("should be in a open state if the socket is open", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event = { type: "transition" };

			readyStates.readyState = readyStates.OPEN;
			actor.send(event);

			expect(socket.send).toBeCalledTimes(1);
			expect(actor.getSnapshot()).toStrictEqual({
				status: "open",
				queue: [],
			});
		});

		it("should be in a closing state if the socket is closing", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event = { type: "transition" };

			readyStates.readyState = readyStates.CLOSING;
			actor.send(event);

			expect(socket.send).not.toBeCalled();
			expect(actor.getSnapshot()).toStrictEqual({
				status: "closing",
				queue: [JSON.stringify(event)],
			});
		});

		it("should be in a closed state if the socket is closed", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event = { type: "transition" };

			readyStates.readyState = readyStates.CLOSED;
			actor.send(event);

			expect(socket.send).not.toBeCalled();
			expect(actor.getSnapshot()).toStrictEqual({
				status: "closed",
				queue: [JSON.stringify(event)],
			});
		});

		it("should throw an error for an unknown connection state", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));

			readyStates.readyState = 10;
			const invoke = () => actor.send({ type: "transition" });

			expect(invoke).toThrowError(/unknown ready state/i);
		});

		it("should change its state when the socket connection is opened", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));

			readyStates.readyState = readyStates.OPEN;
			socket.onopen?.({} as Event);

			expect(actor.getSnapshot()).toStrictEqual({ status: "open", queue: [] });
		});

		it("should change its state when the socket connection is closed", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));

			readyStates.readyState = readyStates.CLOSED;
			socket.onclose?.({} as CloseEvent);

			expect(actor.getSnapshot()).toStrictEqual({
				status: "closed",
				queue: [],
			});
		});

		it("should inform observers about errors on the socket connection", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const obs = {
				next: () => void 0,
				error: jest.fn(),
				complete: () => void 0,
			};

			actor.subscribe(obs);
			socket.onerror?.({} as Event);

			expect(obs.error).toBeCalledTimes(1);
			expect(obs.error).toBeCalledWith({});
		});
	});

	describe("sending events", () => {
		it("should queue events when the socket connection is not open", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event1 = { type: "test.event1" };
			const event2 = { type: "test.event2" };

			actor.send(event1);
			actor.send(event2);

			expect(socket.send).not.toBeCalled();
			expect(actor.getSnapshot()).toStrictEqual({
				status: "connecting",
				queue: [JSON.stringify(event1), JSON.stringify(event2)],
			});
		});

		it("should send queued events when the socket connection is opened", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event1 = { type: "test.event1" };
			const event2 = { type: "test.event2" };
			actor.send(event1);
			actor.send(event2);

			readyStates.readyState = readyStates.OPEN;
			socket.onopen?.({} as Event);

			expect(actor.getSnapshot()).toStrictEqual({ status: "open", queue: [] });
			expect(socket.send).toBeCalledTimes(2);
			expect(socket.send).nthCalledWith(1, JSON.stringify(event1));
			expect(socket.send).nthCalledWith(2, JSON.stringify(event2));
		});

		it("should send events immediately when the socket connection is open", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event = { type: "test.event" };

			readyStates.readyState = readyStates.OPEN;
			actor.send(event);

			expect(actor.getSnapshot()).toStrictEqual({ status: "open", queue: [] });
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith(JSON.stringify(event));
		});

		it("should empty the queue before a new event is send", () => {
			const socket = mock<WebSocket>(readyStates);
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event1 = { type: "test.event1" };
			const event2 = { type: "test.event2" };

			actor.send(event1);
			expect(actor.getSnapshot()?.queue).toStrictEqual([
				JSON.stringify(event1),
			]);
			readyStates.readyState = readyStates.OPEN;
			actor.send(event2);

			expect(actor.getSnapshot()?.queue).toStrictEqual([]);
			expect(socket.send).toBeCalledTimes(2);
			expect(socket.send).nthCalledWith(1, JSON.stringify(event1));
			expect(socket.send).nthCalledWith(2, JSON.stringify(event2));
		});
	});

	describe("receiving events", () => {
		it("should publish all events that are received on the socket connection", () => {
			const socket = mock<WebSocket>(readyStates);
			const subscriber = mock<AnyActor>();
			const actor = spawnBehavior(createWebSocket(() => socket));
			const event1 = { type: "test.event1" };
			const event2 = { type: "test.event2" };

			actor.send(subscribe(subscriber));
			socket.onmessage?.({ data: JSON.stringify(event1) } as MessageEvent);
			socket.onmessage?.({ data: JSON.stringify(event2) } as MessageEvent);

			expect(subscriber.send).toBeCalledTimes(2);
			expect(subscriber.send).nthCalledWith(1, event1);
			expect(subscriber.send).nthCalledWith(2, event2);
		});

		it("should ignore messages that are not events", () => {
			const socket = mock<WebSocket>(readyStates);
			const subscriber = mock<AnyActor>();
			const actor = spawnBehavior(createWebSocket(() => socket));

			actor.send(subscribe(subscriber));
			socket.onmessage?.({ data: "test string" } as MessageEvent);
			socket.onmessage?.({ data: 42 } as MessageEvent);
			socket.onmessage?.({
				data: JSON.stringify({ test: 32 }),
			} as MessageEvent);

			expect(subscriber.send).not.toBeCalled();
		});

		it("should ignore events if they are filtered by a provided filter", () => {
			const socket = mock<WebSocket>(readyStates);
			const subscriber = mock<AnyActor>();
			const actor = spawnBehavior(
				createWebSocket(() => socket, {
					filter: (e) => e.type !== "test.event1",
				})
			);
			const event1 = { type: "test.event1" };
			const event2 = { type: "test.event2" };

			actor.send(subscribe(subscriber));
			socket.onmessage?.({ data: JSON.stringify(event1) } as MessageEvent);
			socket.onmessage?.({ data: JSON.stringify(event2) } as MessageEvent);

			// The filter should lead to event1 being ignored
			expect(subscriber.send).toBeCalledTimes(1);
			expect(subscriber.send).toBeCalledWith(event2);
		});
	});
});
