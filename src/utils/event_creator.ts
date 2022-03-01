import type {
	ActorRef,
	AnyEventObject,
	EventFrom as OriginalEventFrom,
} from "xstate";

// This implementation is a port of `createAction` from Redux Toolkit, adapted
// and simplified to fit into the XState ecosystem.
// Original: https://github.com/reduxjs/redux-toolkit/blob/master/packages/toolkit/src/createAction.ts

type Empty = Record<string, never>;
type Compute<A> = { [K in keyof A]: A[K] } & unknown;

/**
 * Extracts an event shape from provided generic. If the provided generic is not an event
 * creator, the resolution is deferred to the original XState implementation
 * of `EventFrom`.
 *
 * @example
 * const example = createEvent("test.example", (id: string) => ({ id }));
 *
 * type Ev = EventFrom<typeof example>;
 * // Ev is types as: {
 * //   type: "test.event";
 * //   id: string;
 * // }
 */
export type EventFrom<C> = C extends EventCreator<
	infer T,
	infer P,
	infer _A // eslint-disable-line @typescript-eslint/no-unused-vars
>
	? CreatedEvent<T, P>
	: OriginalEventFrom<C>;

/**
 * An event with an optional payload. This is the
 * type of events returned by {@link createEvent} event creators.
 */
export type CreatedEvent<
	T extends string,
	P extends object = Empty
> = P extends Empty ? { type: T } : Compute<{ type: T } & P>;

/** A factory for constructing events that is created by {@link createEvent}. */
export interface EventCreator<
	T extends string,
	P extends object,
	A extends unknown[]
> {
	/** Calling this {@link EventCreator} will return a new event object with the configured event `type`. */
	(...args: A): CreatedEvent<T, P>;

	/** The event type of events that are created with this {@link EventCreator} */
	type: T;

	/** Type predicate that narrows given events to events created with this {@link EventCreator}. */
	match(e: AnyEventObject): e is CreatedEvent<T, P>;

	/**
	 * Creates a function that sends events from this {@link EventCreator} to the given actor when called.
	 *
	 * This is intended as a helper when connecting actors to UIs. It avoids the following boilerplate:
	 *
	 * @example
	 * // Example event creator
	 * const doSomething = createEvent("do.make.something", (data: string) => ({
	 *		data,
	 * }));
	 *
	 * // Creating event-handlers in the UI to send events to an actor
	 * const actor = useInterpret(...); // Actor that can receive "doSomething" events
	 *
	 * // Instead of writing UI event-handlers manually over and over again...
	 * const handleData = (data: string) => actor.send(doSomething(data));
	 * // ... it can be writing like this:
	 * const handleData = doSomething.createSendCall(actor); // (data: string) => void;
	 */
	createSendCall(
		receiver: ActorRef<CreatedEvent<T, P>, unknown>
	): (...args: A) => void;
}

/**
 * Creates an {@link EventCreator} for the given event type, which is an factory
 * for constructing new events of that type.
 * An additional `type` property is attached to the returned {@link EventCreator}
 * function which equals the provided type and can be used to avoid "magic strings".
 *
 * To connect your UI with your actors, you can use the `createSendCall` helper to
 * avoid boilerplate when writing event handlers. See the TSDoc for `createSendCall`
 * on the {@link EventCreator} interface.
 *
 * Furthermore, a `match` type predicate is attached to the {@link EventCreator},
 * which narrows given events to events with the same type.
 *
 * @param type The event type to use for created events.
 * @param prepare An optional function that takes any number of arguments and
 * returns the event payload. The arguments received by this function will be
 * required as arguments for the {@link EventCreator}.
 *
 * @example
 * // constructing event creators.
 * const noData = createEvent("test.no_data");
 * const withData = createEvent("test.data", (id: string) => ({
 *		id,
 *		createdAt: new Date().toISOString()
 * }));
 *
 * //using the event creators
 * console.log(withData("123")) // => { type: "test.data", id: "123", createdAt: "2022-01-07T14:02:25.893Z" }
 * console.log(withData.type) // => "test.data"
 * someActor.send(noData()); // => sends { type: "test.no_data" } to someActor
 * noData.match({type: "other"}) // => false
 * noData.match({type: "test.no_data"}) // => true returned as matching type predicate
 */
export function createEvent<
	T extends string,
	P extends object = Empty,
	A extends unknown[] = []
>(type: T, prepare?: (...args: A) => P): EventCreator<T, P, A> {
	const eventCreator: EventCreator<T, P, A> = (...args): CreatedEvent<T, P> => {
		if (!prepare) return { type } as CreatedEvent<T, P>;

		const payload = prepare(...args);
		if (typeof payload !== "object") {
			throw new TypeError("Prepare must return an object. Was: " + payload);
		}

		return {
			...payload,
			type,
		} as CreatedEvent<T, P>;
	};

	eventCreator.toString = () => `${type}`;
	eventCreator.type = type;
	eventCreator.match = (e: AnyEventObject): e is CreatedEvent<T, P> =>
		e.type === type;

	eventCreator.createSendCall =
		(receiver) =>
		(...args) =>
			receiver.send(eventCreator(...args));

	return eventCreator;
}

// TODO: This is an idea to map event-creators into event object for XState models.
// However, it does not work yet...

// /** Maps event creators to an event object for XState models. */
// export function fromEventCreators<
// 	Creators extends EventCreator<T, P, A>[],
// 	T extends string,
// 	P extends object,
// 	A extends any[]
// >(...creators: Creators): EventMap<Creators> {
// 	const map = {} as EventMap<Creators>;
//
// 	for (const creator of creators) {
// 		const prepare = (...args: A): P => {
// 			// eslint-disable-next-line @typescript-eslint/no-unused-vars
// 			const {type, ...payload} = creator(...args);
// 			return payload as P;
// 		}
// 		map[creator.type] = prepare;
// 	}
//
// 	return map;
// }

// /** Recursively building a map of the different event-creators. */
// type EventMap<FSS extends unknown[]> = FSS extends [infer F, ...infer FS]
// 	? F extends EventCreator<infer T, infer P, infer A>
// 		? Record<T, (...args: A) => P> | EventMap<FS>
// 		: "Array content must consist of event creators."
// 	: never;
