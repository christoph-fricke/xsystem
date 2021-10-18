const config = {
	roots: ["src"],
	testEnvironment: "node",
	collectCoverageFrom: ["src/**", "!**/mod.ts", "!src/main.ts"],
	transform: {
		"^.+\\.(t|j)sx?$": ["@swc-node/jest", { sourcemap: true }],
	},
};

export default config;
