import { createMachine } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { fromMachine } from "./from_machine";

type Event = { type: "ping" } | { type: "pong" };
type Context = Record<string, unknown>;

function createPingMachine() {
	return createMachine<Context, Event>({
		id: "ping",
		initial: "ping",
		states: {
			ping: { on: { ping: "pong" } },
			pong: { on: { pong: "ping" } },
		},
	});
}

describe(fromMachine, () => {
	it("should create a behavior from a machine definition", () => {
		//@ts-expect-error Typings currently do not work correctly
		const behavior = fromMachine(createPingMachine());
		const actor = spawnBehavior(behavior);

		// Test that the spawned behavior works as expected
		expect(actor.getSnapshot()?.value).toBe("ping");

		actor.send({ type: "ping" });

		expect(actor.getSnapshot()?.value).toBe("pong");
	});
});
