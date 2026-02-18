import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import boundariesPlugin from "eslint-plugin-boundaries";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "node_modules/**",
      "eslint.config.js",
      "**/vite.config.ts",
      "index.html",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      import: importPlugin,
      boundaries: boundariesPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json"],
        },
      },
      "boundaries/elements": [
        {
          type: "core",
          pattern: "src/core/*",
        },
        {
          type: "ui",
          pattern: "src/ui/*",
        },
        {
          type: "main",
          pattern: "src/main.ts",
        },
      ],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "no-console": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "core",
              allow: ["core"],
            },
            {
              from: "ui",
              allow: ["core", "ui"],
            },
            {
              from: "main",
              allow: ["core", "ui", "main"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
