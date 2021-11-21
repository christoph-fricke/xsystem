import { anyObject, mock } from "jest-mock-extended";
import type { ActorRef, AnyEventObject, Behavior } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, SubEvent } from "../subscriptions/mod";
import { withSubscription } from "./with_subscription";

type AnyBehavior = Behavior<AnyEventObject, unknown>;
type AnyActor = ActorRef<SubEvent<AnyEventObject>, unknown>;

describe(withSubscription, () => {
	it("should forward received events to the wrapped behavior", () => {
		// For some reason transition is not auto-mocked. It works in "pub_sub.test.ts"
		const transition = jest.fn();
		const behavior = mock<AnyBehavior>({ initialState: "initial", transition });
		const publisher = mock<AnyActor>();
		const event = { type: "test" };

		const wrapped = withSubscription(behavior, publisher);
		const actor = spawnBehavior(wrapped);
		actor.send(event);

		expect(behavior.transition).toBeCalledTimes(1);
		expect(behavior.transition).toBeCalledWith("initial", event, anyObject());
	});

	it("should invoke the original start function to return the starting state", () => {
		const start = jest.fn().mockReturnValue("initial");
		const behavior = mock<AnyBehavior>({ start });
		const publisher = mock<AnyActor>();

		const wrapped = withSubscription(behavior, publisher);
		const actor = spawnBehavior(wrapped);

		expect(behavior.start).toBeCalledTimes(1);
		expect(actor.getSnapshot()).toBe("initial");
	});

	it("should subscribe a behavior to a publisher when spawned", () => {
		const behavior = mock<AnyBehavior>();
		const publisher = mock<AnyActor>();

		const wrapped = withSubscription(behavior, publisher);
		const actor = spawnBehavior(wrapped);

		expect(publisher.send).toBeCalledTimes(1);
		expect(publisher.send).toBeCalledWith(subscribe(actor));
	});

	it("should provide event matches support for the published events", () => {
		const behavior = mock<AnyBehavior>();
		const publisher = mock<AnyActor>();

		const wrapped = withSubscription(behavior, publisher, ["test"]);
		const actor = spawnBehavior(wrapped);

		expect(publisher.send).toBeCalledWith(subscribe(actor, ["test"]));
	});

	it.todo("should unsubscribe a subscribed behavior when stopped");

	it("should infer typings without explicit usage of generics", () => {
		type BehaviorEvent = { type: "test" };
		type PubEvent = { type: "hello" };

		const behavior = mock<Behavior<BehaviorEvent, string>>();
		const publisher = mock<ActorRef<SubEvent<PubEvent>, number>>();

		// @ts-expect-error "foo" is not an published event
		withSubscription(behavior, publisher, ["foo"]);
	});
});
