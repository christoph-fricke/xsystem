/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
const config = {
	tempDirName: "reports/stryker-tmp",
	reporters: ["html", "progress"],
	thresholds: { high: 90, low: 80, break: 75 },

	testRunner: "jest",
	checkers: ["typescript"],
	coverageAnalysis: "perTest",
	jest: {
		projectType: "custom",
		config: (await import("./jest.config.mjs")).default,
		enableFindRelatedTests: true,
	},
};

export default config;
