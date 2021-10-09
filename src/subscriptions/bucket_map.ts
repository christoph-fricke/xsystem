/** Data structure to manage multiple unique values that are assigned to a key. */
export class BucketMap<K, V> {
	private _buckets: Map<K, Set<V>>;

	constructor() {
		this._buckets = new Map();
	}

	/** Removes a given value from every bucket and reports if it affected any buckets. */
	delete(value: V): boolean {
		let affected = false;
		for (const bucket of this._buckets.values()) {
			affected = bucket.delete(value) ? true : affected;
		}
		return affected;
	}

	/** Returns the bucket for a given key or undefined of the key is not present. */
	get(key: K): Set<V> | undefined {
		return this._buckets.get(key);
	}

	/** Checks whether or not a bucket for the given key exists. */
	has(key: K): boolean {
		return this._buckets.has(key);
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

		this._buckets.set(key, new Set<V>().add(value));
		return this;
	}

	/** Returns an {@link IterableIterator} for stored keys.	 */
	keys(): IterableIterator<K> {
		return this._buckets.keys();
	}

	/**
	 * Returns an {@link IterableIterator} for the stored values.
	 * Contains the values of a single bucket of a key is provided.
	 * Otherwise it iterates over the values of all buckets.
	 */
	values(key?: K): IterableIterator<V> {
		if (typeof key !== "undefined")
			return this._buckets.get(key)?.values() ?? new Set<V>().values();

		// Collect all buckets into a mega bucket
		const megaBucket = new Set<V>();
		for (const bucket of this._buckets.values())
			for (const value of bucket) megaBucket.add(value);

		return megaBucket.values();
	}

	[Symbol.iterator](): IterableIterator<[K, Set<V>]> {
		return this._buckets.entries();
	}
}
