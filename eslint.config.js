import globals from "globals";
import html from "@html-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // HTML files
  {
    files: ["**/*.html"],
    plugins: {
      html,
    },
    extends: ["html/recommended"],
    language: "html/html",
    rules: {
      "html/no-duplicate-class": "error",
      "html/element-newline": "error",
      "html/indent": ["error", 4],
      "html/attrs-newline": "error",
      "html/no-extra-spacing-attrs": "error",
    },
  },
]);
