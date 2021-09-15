const config = {
	testEnvironment: "node",
	collectCoverageFrom: ["**/src/**"],
	transform: {
		"^.+\\.tsx?$": "esbuild-jest",
	},
};

export default config;
