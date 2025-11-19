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
    testPathIgnorePatterns: ["<rootDir>/node_modules/"],
};

module.exports = config;
