/** @returns All subset wildcards of a string that can be created by matching the given string. */
export type Wildcard<S extends string, Separator extends string> =
	| (S extends `${infer Start}${Separator}${infer Rest}`
			?
					| `${Start}${Separator}*`
					| `${Start}${Separator}${Wildcard<Rest, Separator>}`
			: never)
	| "*";

/** @returns A array of all wildcards that apply to the given string for the given separator. */
export function getAllWildcards<S extends string, Sep extends string>(
	separator: Sep,
	subject: S
): Wildcard<S, Sep>[] {
	const i = subject.indexOf(separator);

	if (i === -1) return ["*"];

	const start = subject.substring(0, i);
	const end = subject.substring(i + 1);

	return ["*"].concat(
		getAllWildcards(separator, end).map(
			(appendix) => `${start}${separator}${appendix}`
		)
	) as Wildcard<S, Sep>[];
}
