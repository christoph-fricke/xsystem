import type { AnyEventObject, EventFrom as OriginalEventFrom } from "xstate";

// This implementation is a port of `createAction` from Redux Toolkit, adapted
// and simplified to fit into the XState ecosystem.
// Original: https://github.com/reduxjs/redux-toolkit/blob/master/packages/toolkit/src/createAction.ts

type UnknownFunction = (...args: unknown[]) => unknown;
export type Compute<A> = { [K in keyof A]: A[K] } & unknown;

/**
 * Extracts an event shape from provided type. If the provided type is not an event
 * creator, the resolution is deferred to the original XState implementation
 * of `EventFrom`.
 */
export type EventFrom<C> = C extends BaseEventCreator<infer T, infer P>
	? ConstructedEvent<T, P>
	: OriginalEventFrom<C>;

/**
 * An event with an associated payload. This is the
 * type of events returned by `createEvent()` event creators.
 */
export type ConstructedEvent<
	T extends string,
	P extends object = Record<string, never>
> = P extends Record<string, never> ? { type: T } : Compute<{ type: T } & P>;

/** A "prepare" method to be used as the second parameter of {@link createEvent}. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrepareEvent<P extends object> = (...args: any[]) => P;

/**
 * Intermediate step to infer the payload and arguments from prepareEvent.
 * @internal
 */
type _EventCreatorWithPayload<
	T extends string,
	PE extends PrepareEvent<object>
> = PE extends PrepareEvent<infer P>
	? EventCreatorWithPayload<T, Parameters<PE>, P>
	: never;

/** Basic type for all event creators. */
interface BaseEventCreator<T extends string, P extends object> {
	type: T;
	match: (e: AnyEventObject) => e is ConstructedEvent<T, P>;
}

/**
 * An event creator that takes multiple arguments which are passed
 * to a `PrepareEvent` method to create the final event.
 */
export interface EventCreatorWithPayload<
	T extends string,
	Args extends unknown[],
	P extends object
> extends BaseEventCreator<T, P> {
	/** Calling this event creator with `Args` will return an event event object for the type. */
	(...args: Args): ConstructedEvent<T, P>;
}

/** An event creator of type `T` that takes no payload. */
export interface EventCreatorNoPayload<T extends string>
	extends BaseEventCreator<T, Record<string, never>> {
	/** Calling this {@link EventCreator} will return a new event object with the defined type. */
	(): ConstructedEvent<T>;
}

/**
 * A utility function to create an event creator for the given event type.
 * An additional `type` property is attached to the event creator
 * function which equals the provided type and can be referenced in machine
 * definition to avoid duplicate event types and to simplify refactoring.
 *
 * Furthermore, a `match` method is attached to the event creator to serve as
 * a type predicate, which narrows given events to events with the same type as
 * events from the created event creator.
 *
 * Lastly, the event creator function will have its `toString()` method overridden
 * so that it returns the event type.
 *
 * @param type The event type to use for created events.
 * @param prepare A method that takes any number of arguments and returns the event payload.
 */
export function createEvent<T extends string>(
	type: T
): EventCreatorNoPayload<T>;

export function createEvent<T extends string, PE extends PrepareEvent<object>>(
	type: T,
	prepareEvent: PE
): _EventCreatorWithPayload<T, PE>;

export function createEvent(
	type: string,
	prepareEvent?: UnknownFunction
): unknown {
	function eventCreator(...args: unknown[]) {
		if (!prepareEvent) return { type };

		const payload = prepareEvent(...args);
		if (typeof payload !== "object") {
			throw new Error("prepareEvent must return an object. Was: " + payload);
		}

		return {
			...payload,
			type,
		};
	}

	eventCreator.toString = () => `${type}`;
	eventCreator.type = type;
	eventCreator.match = (e: AnyEventObject) => e.type === type;

	return eventCreator;
}
