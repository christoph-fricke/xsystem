const config = {
	roots: ["src"],
	testEnvironment: "node",
	collectCoverageFrom: ["src/**", "!**/mod.ts", "!src/main.ts"],
	transform: {
		"^.+\\.tsx?$": "esbuild-jest",
	},
};

export default config;
