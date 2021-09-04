/** Creates a new {@link BroadcastChannel}. Falls back to a mock implementation if the API is undefined. */
export function createBroadcastChannel(id: string): BroadcastChannel {
	return typeof BroadcastChannel !== "undefined"
		? new BroadcastChannel(id)
		: new BroadcastChannelMock(id);
}

/** Mock implementation of {@link BroadcastChannel} as a fallback for Safari browsers. */
class BroadcastChannelMock implements BroadcastChannel {
	name: string;
	onmessage:
		| ((this: BroadcastChannel, ev: MessageEvent<unknown>) => unknown)
		| null;
	onmessageerror:
		| ((this: BroadcastChannel, ev: MessageEvent<unknown>) => unknown)
		| null;

	constructor(name: string) {
		this.name = name;
		this.onmessage = null;
		this.onmessageerror = null;
	}
	close(): void {
		/* do nothing */
	}
	postMessage(): void {
		/* do nothing */
	}
	addEventListener(): void {
		/* do nothing */
	}
	removeEventListener(): void {
		/* do nothing */
	}
	dispatchEvent(): boolean {
		/* do nothing */
		return false;
	}
}
