import { BucketMap } from "./bucket_map";

describe(BucketMap, () => {
	it("should construct an empty map", () => {
		const map = new BucketMap<string, string>();

		expect(Array.from(map)).toHaveLength(0);
	});

	describe("add", () => {
		it("should create a new bucket with the value if the key does not exist yet", () => {
			const map = new BucketMap<string, string>();

			map.add("key", "value");

			expect(map.has("key")).toBe(true);
			expect(map.get("key")).toStrictEqual(new Set(["value"]));
		});

		it("should add the value to a bucket for the key if the bucket already exists", () => {
			const map = new BucketMap<string, string>();

			map.add("key", "value1");
			map.add("key", "value2");

			expect(map.has("key")).toBe(true);
			expect(map.get("key")).toStrictEqual(new Set(["value1", "value2"]));
		});
	});

	describe("get", () => {
		it("should return the bucket for a given key", () => {
			const map = new BucketMap<string, string>();
			map.add("test", "value");

			const bucket = map.get("test");

			expect(bucket).toStrictEqual(new Set(["value"]));
		});

		it("should return undefined if the key does not exists", () => {
			const map = new BucketMap<string, string>();

			const bucket = map.get("test");

			expect(bucket).toBeUndefined();
		});
	});

	describe("delete", () => {
		it("should delete an existing value from a bucket and return true", () => {
			const map = new BucketMap<string, string>();
			map.add("test", "value");

			const affected = map.delete("value");

			expect(affected).toBe(true);
			expect(map.get("test")).toStrictEqual(new Set());
		});

		it("should delete an existing value from all buckets", () => {
			const map = new BucketMap<string, string>();
			map.add("test1", "value");
			map.add("test2", "value");

			map.delete("value");

			expect(map.get("test1")).toStrictEqual(new Set());
			expect(map.get("test2")).toStrictEqual(new Set());
		});
	});

	describe("has", () => {
		it("should return true if a key exists in the map", () => {
			const map = new BucketMap<string, string>();
			map.add("test", "value");

			const exists = map.has("test");

			expect(exists).toBe(true);
		});

		it("should return false if a key does not exists in the map", () => {
			const map = new BucketMap<string, string>();

			const exists = map.has("test");

			expect(exists).toBe(false);
		});
	});

	describe("keys", () => {
		it("should return an iterable of all keys", () => {
			const map = new BucketMap<string, string>();
			map.add("test1", "value");
			map.add("test2", "value");

			const keys = Array.from(map.keys());

			expect(keys).toStrictEqual(["test1", "test2"]);
		});
	});

	describe("values", () => {
		it("should return the values from all buckets if no key is provided", () => {
			const map = new BucketMap<string, string>();
			map.add("test1", "value1");
			map.add("test2", "value2");

			const values = Array.from(map.values());

			expect(values).toStrictEqual(["value1", "value2"]);
		});

		it("should return the values from a specific buckets if a key is provided", () => {
			const map = new BucketMap<string, string>();
			map.add("test1", "value1");
			map.add("test2", "value2");

			const values = Array.from(map.values("test1"));

			expect(values).toStrictEqual(["value1"]);
		});
	});
});
