/** Data structure to manage multiple unique values that are assigned to a key. */
export class BucketMap<K, V> {
	#buckets: Map<K, Set<V>>;

	constructor() {
		this.#buckets = new Map();
	}

	/**
	 * Removes a value from every bucket.
	 * @returns `true` if at least one bucket has been affected.
	 */
	delete(value: V): boolean {
		let affected = false;
		for (const bucket of this.#buckets.values()) {
			affected = bucket.delete(value) ? true : affected;
		}
		return affected;
	}

	/** @returns the bucket for a given key. */
	get(key: K): Set<V> | undefined {
		return this.#buckets.get(key);
	}

	/** @returns `true` when a bucket exists for a given key. */
	has(key: K): boolean {
		return this.#buckets.has(key);
	}

	/**
	 * Adds a value to the bucket for a given key.
	 * Creates a new bucket if the key does not exists.
	 */
	add(key: K, value: V): this {
		const bucket = this.get(key);

		if (bucket) {
			bucket.add(value);
			return this;
		}

		this.#buckets.set(key, new Set<V>().add(value));
		return this;
	}

	entries(): IterableIterator<[K, Set<V>]> {
		return this.#buckets.entries();
	}

	keys(): IterableIterator<K> {
		return this.#buckets.keys();
	}

	/**
	 * Returns an {@link IterableIterator} for stored values.
	 * Contains the values of a single bucket of a key is provided.
	 * Otherwise it iterates over the values of all buckets.
	 */
	values(key?: K): IterableIterator<V> {
		if (typeof key !== "undefined")
			return this.#buckets.get(key)?.values() ?? new Set<V>().values();

		// Collect all buckets into a mega bucket
		const megaBucket = new Set<V>();
		for (const bucket of this.#buckets.values())
			for (const value of bucket) megaBucket.add(value);

		return megaBucket.values();
	}

	[Symbol.iterator](): IterableIterator<[K, Set<V>]> {
		return this.entries();
	}
}
