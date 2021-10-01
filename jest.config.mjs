const config = {
	rootDir: "src",
	testEnvironment: "node",
	collectCoverageFrom: ["**/src/**"],
	transform: {
		"^.+\\.tsx?$": "esbuild-jest",
	},
};

export default config;
