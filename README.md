# XSystem

[![GitHub issues](https://shields.io/github/issues-raw/christoph-fricke/xsystem?style=for-the-badge)](https://github.com/christoph-fricke/xsystem/issues)
[![latest release](https://shields.io/github/v/release/christoph-fricke/xsystem?style=for-the-badge)](https://github.com/christoph-fricke/xsystem/releases/latest)
![dependencies](https://shields.io/david/christoph-fricke/xsystem?style=for-the-badge)

> Building Blocks for [XState](https://github.com/statelyai/xstate)-based Actor
> Systems.

This package aims to extend the actor concepts that are present in XState and
provide "plug 'n play" components. These come in the form of ready-to-use
behavior, composable higher-order behavior, and utility functions.

At its core, `xsystem` provides mechanisms for actors to subscribe to events
from other actors. An actor is able to send events to all its subscribers.
Natively in XState, actors are only able to subscribe to state changes of
another actor.

> Disclaimer: The documentation is work-in-progress. Better usage information
> will be added over time. For now, rely on the type-docs when using the
> library.

## Installation

This package is bundled and distributes with ESM imports/exports. Furthermore,
`xsystem` has a peer dependency to `xstate`.

```bash
npm i xsystem
# or
yarn add xsystem
```

## Subscription Mechanism

The provided subscription mechanism is based on events. It is implemented and
supported by the _event bus_ and _pub/sub_ behavior. Other actors can subscribe
to published events from an actor that supports subscriptions, with a
`subscribe` event and a reference to themself. To unsubscribe, a `unsubscribe`
event can be sent.

A subscribing actor does not have to subscribe to all published events. An array
of wildcards can be provided that match against published events. For example,
the event `user.click` is matched with: `user.click`, `user.*`, and `*`.

## Event Bus

Behavior that can be used to spawn event busses in an actor system. An event bus
proxies all received event to all relevant subscribers.

## Higher-Order Behavior

A Higher-order behavior as a `Behavior` that accepts another `Behavior` as an
argument. It can be used to add common functionality to the given `Behavior`.

### `withPubSub`

Adds publish/subscribe functionality to a given `Behavior`.

### `withHistory`

Adds undo/redo functionality to a given `Behavior`.

## Utilities

### `fromMachine`

Creates a `Behavior` from a given machine that is created with `createMachine`
or `model.createMachine`.

### `fromActor`

Creates a service from a given actor and subscribes the machine to published
event of that actor.

### `is`

Type predicate that can be used to determine if a given event is of a specific
event type.

## Related Work

Similar concepts are explored by the following packages:

- [xstate-behaviors by Chris Shank](https://github.com/ChrisShank/xstate-behaviors)
- [xstate-pubsub by Chance](https://github.com/chanced/xstate-pubsub)
