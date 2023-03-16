/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    // Disable ESLint code formatting rules which conflict with Prettier
    "prettier",
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
  ],
  ignorePatterns: ["**/storybook-static"],
  // Additional lint rules. These get layered onto the top-level rules.
  overrides: [
    {
      files: "e2e/*.spec.*",
      extends: ["plugin:playwright/playwright-test"],
    },
    // Lint config specific to TypeScript files
    {
      files: ["app/*.+(ts|tsx)", "stories/*.+(ts|tsx)"],
      parserOptions: {
        // These paths need defined to support rules that require type information
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        // Disable vanilla ESLint rules that conflict with those in @typescript-eslint
        "plugin:@typescript-eslint/eslint-recommended",
        // Rules that specifically require type information
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      plugins: ["@typescript-eslint"],
      rules: {
        // Prevent dead code accumulation
        "@typescript-eslint/no-unused-vars": "error",
        // The usage of `any` defeats the purpose of typescript. Consider using `unknown` type instead instead.
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
    // Lint config specific to Test files
    {
      files: ["tests/**"],
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
      rules: {
        "jest/valid-expect": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unused-expressions": "off",
      },
    },
  ],
  settings: {
    // Support projects where Next.js isn't installed in the root directory (such as a monorepo)
    next: {
      rootDir: __dirname,
    },
  },
};
