module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    // turns off rules that might clash with prettier js
    "prettier",
    "plugin:import/recommended",
    "plugin:import/errors",
    // Needed to support TS for eslint-plugin-import
    "plugin:import/typescript",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  ignorePatterns: ["dist/", "webpack.config.js", ".eslintrc.js"],
  rules: {
    semi: ["error", "always"],
    camelcase: ["error", { properties: "never", ignoreDestructuring: true }],
    eqeqeq: "error",
    "no-trailing-spaces": "error",
    "react-hooks/rules-of-hooks": "error",
    "eol-last": ["error", "always"],

    // Ordering JS imports
    ["import/order"]: [
      "error",
      {
        alphabetize: {
          caseInsensitive: true,
          order: "asc",
        },
        groups: ["external", "builtin", "parent", ["sibling", "index"]],
        "newlines-between": "always",
      },
    ],
  },
};
