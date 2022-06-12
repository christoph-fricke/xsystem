/** @type {import("@jest/types").Config.InitialOptions} */
const config = {
	roots: ["src"],
	testEnvironment: "node",
	collectCoverageFrom: ["src/**", "!**/mod.ts", "!src/main.ts"],
	coverageDirectory: "reports/coverage",
	transform: {
		"^.+\\.(t|j)sx?$": ["@swc/jest"],
	},
};

export default config;
