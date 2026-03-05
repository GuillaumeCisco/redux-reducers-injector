const js = require("@eslint/js");
const globals = require("globals");
const reactPlugin = require("eslint-plugin-react");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
      }
    },
    rules: {}
  }
];