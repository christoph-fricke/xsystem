/** Construct event objects from a union of event strings. */
export type FromEventTypes<T extends string> = { type: T };
