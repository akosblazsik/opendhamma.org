// eslint.config.mjs
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
// Removed FlatCompat as it's less needed with the new config format directly

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  { // Global ignores
    ignores: [
      ".next/",
      "node_modules/",
      "out/",
      ".vscode/",
      // Add other ignores if needed
    ],
  },
  { // Base configuration for JS/TS files
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        React: "readonly", // Make React global available
        // Add browser/node globals if necessary
        // browser: true,
        // node: true,
        // es2021: true,
      },
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": tsPlugin, // Use TS plugin
    },
    rules: {
      // Base recommended rules (examples, customize as needed)
      ...tsPlugin.configs["eslint-recommended"].rules, // Apply base ESLint rules adapted for TS
      ...tsPlugin.configs["recommended"].rules, // Apply recommended TS rules
      // Example: Disable specific rules if needed
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Allow unused vars starting with _
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error for 'any'
    },
  },
  { // React specific configuration
    files: ["**/*.{jsx,tsx}"], // Target JSX/TSX files
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@next/next": nextPlugin, // Add Next.js plugin HERE
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules, // If using new JSX transform
      ...hooksPlugin.configs.recommended.rules, // React Hooks rules
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules, // Add Next.js rules HERE
      ...nextPlugin.configs["core-web-vitals"].rules, // Core Web Vitals rules
      // Example custom rule settings:
      "react/prop-types": "off", // Often not needed with TypeScript
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      // Keep react/no-unescaped-entities as error (default) or change if needed
      // 'react/no-unescaped-entities': 'warn', // Example: downgrade to warning
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
  },
];

export default eslintConfig;