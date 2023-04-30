import { spawnBehavior } from "xstate/lib/behaviors";
import { AsyncBehavior, withAsync, AsyncStatus } from "./async";

type Resolvable<T> = Promise<T> & {
	resolve: (value: T) => void;
};
function createResolvable<T>(): Resolvable<T> {
	let resolve: (value: T) => void;
	const promise = new Promise((res) => {
		resolve = res;
	}) as Resolvable<T>;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	promise.resolve = resolve;
	return promise;
}

function flush(): Promise<void> {
	// This seems to work quite fine for flushing outstanding promises, which will
	// be resolved in the next runtime step anyway. With a newer dev XState version, we
	// might switch to `waitFor` from XState.
	return Promise.resolve();
}

describe("withAsync", () => {
	const testBehavior: AsyncBehavior<{ type: "test" }, string> = {
		initialState: "initial",
		start: async () => "started",
		transition: async () => "transitioned",
	};

	it("should be started with the initial state", () => {
		const actor = spawnBehavior(withAsync(testBehavior));

		expect(actor.getSnapshot()?.state).toBe("initial");
	});

	it("should evaluate the state returned by the start callback", async () => {
		const actor = spawnBehavior(withAsync(testBehavior));

		await flush();

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");
		expect(actor.getSnapshot()?.state).toBe("started");
	});

	it("should return the stale state while resolving the new state", async () => {
		const actor = spawnBehavior(withAsync(testBehavior));

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolving");
		expect(actor.getSnapshot()?.state).toBe("initial");

		await flush();
		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");

		actor.send({ type: "test" });
		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolving");
		expect(actor.getSnapshot()?.state).toBe("started");
	});

	it("should evaluate the transition when an event is received", async () => {
		const actor = spawnBehavior(withAsync(testBehavior));

		actor.send({ type: "test" });
		await flush();

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");
		expect(actor.getSnapshot()?.state).toBe("transitioned");
	});

	it("should handle and forward events when it is already resolving", async () => {
		const actor = spawnBehavior(withAsync(testBehavior));
		const spy = jest.spyOn(testBehavior, "transition");

		actor.send({ type: "test" });
		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolving");

		actor.send({ type: "test" });
		actor.send({ type: "test" });
		await flush();

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");
		expect(spy).toBeCalledTimes(3);
	});

	it("should ignore internal resolve events when it is not resolving", async () => {
		const testBehavior: AsyncBehavior<{ type: "test" }, string> = {
			initialState: "initial",
			transition: () => "transitioned",
		};
		const actor = spawnBehavior(withAsync(testBehavior));

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");
		actor.send({ type: "xsystem.internal.resolved", state: "test" });
		await flush();

		expect(actor.getSnapshot()?.state).toBe("initial");
	});

	it("should ignore internal reject events when it is not resolving", async () => {
		const testBehavior: AsyncBehavior<{ type: "test" }, string> = {
			initialState: "initial",
			transition: () => "transitioned",
		};
		const actor = spawnBehavior(withAsync(testBehavior));

		expect(actor.getSnapshot()?.status).toBe<AsyncStatus>("resolved");
		actor.send({ type: "xsystem.internal.rejected", state: "test" });
		await flush();

		expect(actor.getSnapshot()?.state).toBe("initial");
	});

	describe("race conditions", () => {
		it("should ignore promises that resolve after newer promises", async () => {
			const promise1 = createResolvable<string>();
			const promise2 = createResolvable<string>();
			const asyncBehavior: AsyncBehavior<{ type: "test1" | "test2" }, string> =
				{
					initialState: "initial",
					transition: (_, e) => (e.type === "test1" ? promise1 : promise2),
				};
			const actor = spawnBehavior(withAsync(asyncBehavior));
			const sendSpy = jest.spyOn(actor, "send");

			actor.send({ type: "test1" });
			actor.send({ type: "test2" });

			promise2.resolve("resolved 2");
			promise1.resolve("resolved 1");
			await flush();

			expect(sendSpy).not.toBeCalledWith(
				expect.objectContaining({ state: "resolved 1" })
			);
			expect(actor.getSnapshot()?.state).toBe("resolved 2");
		});

		it("should ignore promises once new events are received", async () => {
			const promise1 = createResolvable<string>();
			const asyncBehavior: AsyncBehavior<{ type: "test1" | "test2" }, string> =
				{
					initialState: "initial",
					transition: (_, e) => (e.type === "test1" ? promise1 : "state 2"),
				};
			const actor = spawnBehavior(withAsync(asyncBehavior));
			const sendSpy = jest.spyOn(actor, "send");

			actor.send({ type: "test1" });
			actor.send({ type: "test2" });

			promise1.resolve("resolved 1");
			await flush();

			expect(sendSpy).not.toBeCalledWith(
				expect.objectContaining({ state: "resolved 1" })
			);
			expect(actor.getSnapshot()?.state).toBe("state 2");
		});
	});
});
