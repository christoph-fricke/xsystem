# XSystem

[![GitHub issues](https://shields.io/github/issues-raw/christoph-fricke/xsystem?style=for-the-badge)](https://github.com/christoph-fricke/xsystem/issues)
[![latest release](https://shields.io/github/v/release/christoph-fricke/xsystem?style=for-the-badge)](https://github.com/christoph-fricke/xsystem/releases/latest)
![dependencies](https://img.shields.io/badge/dependencies-none-success?style=for-the-badge)

> Building Blocks for [XState](https://github.com/statelyai/xstate)-based Actor
> Systems.

This package aims to extend the actor concepts that are present in _XState_ and
provide "plug 'n play" components. These come in the form of ready-to-use
behavior, composable higher-order behavior, and utility functions.

At its core, _XSystem_ provides mechanisms for actors to subscribe to events
from other actors. An actor is able to publish events to all subscribers.
Natively in XState, actors are only able to subscribe to state changes of
another actor.

## Installation

_XSystem_ has a peer dependency to _XState_, which has to be installed as well.
Currently, this library is bundled and distributed as an ES module.

```bash
npm i xstate xsystem
```

## Documentation

All features that are available in _XSystem_ are documented in the
[wiki](https://github.com/christoph-fricke/xsystem/wiki) of this repository.

This package is spearheading actor-system concepts for the _XState_ community.
Based on community feedback and new developments in _XState_, the functionality
provided in _XSystem_ is open to change as the community settles on best
practices around actor systems. These might also include radical changes when it
significantly improves the developer experience.

## Related Work

Similar concepts for XState are explored by the following packages:

- [xstate-behaviors by Chris Shank](https://github.com/ChrisShank/xstate-behaviors)
- [xstate-pubsub by Chance](https://github.com/chanced/xstate-pubsub)

## License

This project is published under the [MIT license](./LICENSE). All contributions
are welcome.
