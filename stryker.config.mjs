/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
const config = {
	tempDirName: "reports/stryker-tmp",
	reporters: ["html", "progress"],
	coverageAnalysis: "perTest",
	checkers: ["typescript"],
	testRunner: "jest",
	jest: {
		projectType: "custom",
		config: (await import("./jest.config.mjs")).default,
		enableFindRelatedTests: true,
	},
};

export default config;
