# xsystem

> Building Blocks for Actor Systems with [XState](https://github.com/statelyai/xstate).

## Usage

Until the package is published, it can be used with the following steps:

1. Clone the Repository
2. Pack the library with `npm pack`
3. Install it somewhere with `npm i <path-to-.tgz>`

## Concepts

At its core, `xsystem` provides mechanisms for actors to subscribe to events from
other actors. An actor is able to send events to all its subscribers. Natively in
XState, actors are only able to subscribe to state changes of another actor.

This subscription mechanism is used for the first few building blocks.

### Event Bus

An event bus provides a many-to-many communication mechanism for the actor system.
Events sent to the event bus are forwarded to all actors that subscribed to the bus
for that event type.

### Registry

Work has started to explore mechanisms and implementations of a registry, which
can be compared with an IoC container. A registry provides access to registered actors.
Ultimately, it should matter in which context another actors is executed, e.g. the registry should
be able to spawn an actor off-thread in a web worker and still provide access to that actor.

## Related Work

- [xstate-behaviors by Chris Shank](https://github.com/ChrisShank/xstate-behaviors)
- [xstate-pubsub by Chance](https://github.com/chanced/xstate-pubsub)
