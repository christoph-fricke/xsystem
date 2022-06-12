const config = {
	roots: ["src"],
	testEnvironment: "node",
	collectCoverageFrom: ["src/**", "!**/mod.ts", "!src/main.ts"],
	transform: {
		"^.+\\.(t|j)sx?$": ["@swc/jest"],
	},
};

export default config;
