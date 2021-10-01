import { getAllWildcards } from "./wildcard";

describe(getAllWildcards, () => {
	const cases: [input: string, expected: string[]][] = [
		["", ["*"]],
		["noSeparator", ["*"]],
		["start.end", ["*", "start.*"]],
		["start.middle.end", ["*", "start.*", "start.middle.*"]],
		[
			"first.second.third.fourth",
			["*", "first.*", "first.second.*", "first.second.third.*"],
		],
	];

	test.each(cases)("input %p should return %p", (input, expected) => {
		const actual = getAllWildcards(".", input);

		expect(actual).toStrictEqual(expected);
	});

	it("should accept dot as a wildcard", () => {
		const actual = getAllWildcards(".", "start.end");

		expect(actual).toStrictEqual(["*", "start.*"]);
	});

	it("should accept slash as a wildcard", () => {
		const actual = getAllWildcards("/", "start/end");

		expect(actual).toStrictEqual(["*", "start/*"]);
	});
});
