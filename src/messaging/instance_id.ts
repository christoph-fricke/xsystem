declare global {
	// eslint-disable-next-line no-var
	var _xsystem_random: number | undefined;
}

/** Get a random number that remains the same during a session. */
export function getInstanceID(): number {
	if (typeof globalThis._xsystem_random === "undefined") {
		globalThis._xsystem_random = Math.floor(Math.random() * 1_000_000);
	}
	return globalThis._xsystem_random;
}
