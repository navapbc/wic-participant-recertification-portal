import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    "^app/(.*)$": "<rootDir>/app/$1",
    "^tests/(.*)$": "<rootDir>/tests/$1",
    "^public/(.*)$": "<rootDir>/public/$1",
  },
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/prismaMock.ts"],
  testMatch: ["**/tests/**/*.test.(ts|tsx|js)"],
};

export default jestConfig;
