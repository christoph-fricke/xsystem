import { assertDefined } from "./assertions";

describe(assertDefined, () => {
	it("should throw an error if the given value is undefined", () => {
		const call = () => assertDefined(undefined);

		expect(call).toThrowError(/value is undefined/i);
	});

	it("should throw an error with a custom message", () => {
		const message = "This is an error message!";

		const call = () => assertDefined(undefined, message);

		expect(call).toThrowError(message);
	});

	it("should not throw an error if the given value is defined", () => {
		const call = () => assertDefined(0);

		expect(call).not.toThrowError();
	});
});
