module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
