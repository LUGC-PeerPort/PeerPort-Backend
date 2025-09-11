export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ["**/src/**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
    },
    reporters: [
        "default",
        [
            "jest-ctrf-json-reporter", {
                outputFile: "ctrf-report.json",
                outputDir: "src/Tests",
                appName: "PeerPort",
                appVersion: "1.0.0",
            }
        ],
        ["github-actions", {silent: false}]
    ],

    modulePathIgnorePatterns: [
        "<rootDir>/dist/"
    ]
};