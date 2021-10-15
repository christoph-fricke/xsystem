import type { AnyEventObject } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { createBehavior } from "./create_behavior";

describe(createBehavior, () => {
	describe("defining an initial state", () => {
		it("should throw an error if no initial state is provided", () => {
			const call = () => createBehavior(() => void 0);
			expect(call).toThrow(/initial state/i);
		});

		it("should build a behavior with the defined initial state", () => {
			const behavior = createBehavior<AnyEventObject, string>((b) => {
				b.initialState("test");
			});

			expect(behavior.initialState).toBe("test");
		});
	});

	describe("defining start behavior", () => {
		it("should use the provided function as part of the start behavior", () => {
			const start = jest.fn();
			const behavior = createBehavior<AnyEventObject, string>((b) => {
				b.initialState("test");
				b.start(start);
			});

			const actor = spawnBehavior(behavior);

			expect(actor.getSnapshot()).toBe("test");
			expect(start).toBeCalledTimes(1);
		});
	});
});
