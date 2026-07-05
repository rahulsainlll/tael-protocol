// Shared flat ESLint config for the whole monorepo.
// Consumed by the root `eslint.config.js`, which lints every workspace.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    // Never lint generated output or vendored code.
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Unused vars are warnings; allow intentional `_`-prefixed placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // `any` is discouraged but not fatal — surfaces in review, not as a red build.
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer `import type` for type-only imports (pairs with verbatimModuleSyntax).
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  // Must be last: turns off any rules that conflict with Prettier formatting.
  prettier,
);
