import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
    "^app/(.*)$": "<rootDir>/app/$1",
    "^tests/(.*)$": "<rootDir>/tests/$1",
    "^public/(.*)$": "<rootDir>/public/$1",
    "^file-type$": require.resolve("./tests/helpers/mockFileType.ts"),
  },
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "<rootDir>/tests/helpers/prismaMock.ts",
    "<rootDir>/tests/helpers/s3ConnectionMock.ts",
  ],
  testMatch: ["**/tests/**/*.test.(ts|tsx|js)"],
};

export default jestConfig;
