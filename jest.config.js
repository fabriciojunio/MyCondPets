const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "\\.(css|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/$1",
  },

  collectCoverageFrom: [
    "app/**/*.{js,jsx}",
    "components/**/*.{js,jsx}",
    "!**/*.test.{js,jsx}",
    "!**/node_modules/**",
  ],

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],

  // Permite ESM sem precisar de Babel
  transform: {},
};

module.exports = createJestConfig(customJestConfig);
