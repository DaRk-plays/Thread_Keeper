import js from "@eslint/js";
import tsPlugin from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    files: ["src/web/public/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        fetch: "readonly",
        window: "readonly",
        console: "readonly"
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    ignores: ["dist/**", "node_modules/**"]
  }
];
