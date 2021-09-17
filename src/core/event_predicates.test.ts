import { is } from "./event_predicates";

interface TestEvent {
	type: "test_event";
}

describe(`${is.name}`, () => {
	test("should return true for matching events", () => {
		const actual = is<TestEvent>("test_event", {
			type: "test_event",
			arbitrary: 123,
		});

		expect(actual).toBe(true);
	});

	test("should return false for missmatching events", () => {
		const actual = is<TestEvent>("test_event", {
			type: "some_event",
			arbitrary: 123,
		});

		expect(actual).toBe(false);
	});
});