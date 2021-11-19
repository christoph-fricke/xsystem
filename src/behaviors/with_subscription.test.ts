import { mock } from "jest-mock-extended";
import type { ActorRef, AnyEventObject, Behavior } from "xstate";
import { spawnBehavior } from "xstate/lib/behaviors";
import { subscribe, SubEvent } from "../subscriptions/mod";
import { withSubscription } from "./with_subscription";

type AnyBehavior = Behavior<AnyEventObject, unknown>;
type AnyActor = ActorRef<SubEvent<AnyEventObject>, unknown>;

describe(withSubscription, () => {
	it("should subscribe a behavior to a publisher when spawned", () => {
		const behavior = mock<AnyBehavior>();
		const publisher = mock<AnyActor>();

		const wrapped = withSubscription(behavior, publisher);
		const actor = spawnBehavior(wrapped);

		expect(publisher.send).toBeCalledTimes(1);
		expect(publisher.send).toBeCalledWith(subscribe(actor));
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
