/** @type {import('jest').Config} */
const config = {
    testEnvironment: "jsdom",
    testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
    preset: "ts-jest",
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                tsconfig: {
                    jsx: "react-jsx",
                },
            },
        ],
    },
    transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
    collectCoverageFrom: [
        "src/utils/**/*.ts",
        "src/features/**/service.ts",
        "src/repositories/**/*.ts",
        "src/app/api/**/*ApiHandler.ts",
        "src/error/**/*.ts",
    ],
};

module.exports = config;
