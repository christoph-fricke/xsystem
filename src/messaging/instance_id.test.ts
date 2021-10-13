import { getInstanceID } from "./instance_id";

describe(getInstanceID, () => {
	beforeEach(() => {
		// Reset the global cache for the instance identifier
		globalThis._xsystem_random = undefined;
	});

	it("should use a global variable to reuse the identifier", () => {
		const identifier = getInstanceID();

		expect(globalThis._xsystem_random).toBe(identifier);
	});

	it("should return the same identifier for multiple requests", () => {
		const firstCall = getInstanceID();
		const secondCall = getInstanceID();

		expect(firstCall).toBe(secondCall);
	});

	it("should depend on an random number", () => {
		jest.spyOn(global.Math, "random").mockReturnValue(0.5);

		const actual = getInstanceID();

		expect(actual).toBe(500_000);
		jest.restoreAllMocks();
	});
});
