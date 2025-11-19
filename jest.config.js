export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ["**/tests/**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    transform: {
        "^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true }],
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1", // strip .js for TS imports in tests
    },

    // Coverage configuration
    collectCoverage: true,
    coverageReporters: ["json-summary", "text"],
    coverageDirectory: "tests/coverage",
    reporters: [
        "default",
        [
            "jest-ctrf-json-reporter", {
                outputFile: "ctrf-report.json",
                outputDir: "tests",
                appName: "PeerPort",
                appVersion: "1.0.0",
            }
        ],
        ["github-actions", {silent: false}],
        ["jest-junit", {outputDirectory: "tests/coverage", outputName: "junit.xml"}]
    ],

    modulePathIgnorePatterns: [
        "<rootDir>/dist/"
    ]
};