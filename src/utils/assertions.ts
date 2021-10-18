/** Asserts that a given value is defined. Throws otherwise. */
export function assertDefined<T>(
	value: T | undefined,
	message?: string
): asserts value is T {
	if (value === undefined)
		throw new Error(
			message ?? "Expected that value is defined but value is undefined!"
		);
}
