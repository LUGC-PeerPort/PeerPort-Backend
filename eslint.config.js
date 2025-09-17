import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import jsdoc from "eslint-plugin-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
	globalIgnores(["**/node_modules", "**/dist", "src/Tests/coverage"]), 
	{
		extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),

		plugins: {
			"@typescript-eslint": typescriptEslint,
			jsdoc
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",

			parserOptions: {
				project: "tsconfig.json",
			},
		},
		ignores: [
			"node_modules",
			"dist",
			"src/Tests/coverage",
			"*.config.js"
		],
		rules: {
			/* --- Structure & Naming --- */
			// Enforce camelCase for variables and functions (including object properties)
			"camelcase": ["error", { properties: "always", ignoreDestructuring: false }],

			// Require PascalCase for class names and constructors
			"new-cap": ["error", { newIsCap: true, capIsNew: false }],

			// Enforce naming conventions:
			//   - camelCase (myVar, doSomething)
			//   - PascalCase (MyClass, UserComponent)
			//   - UPPER_CASE_SNAKE_CASE (MY_CONST)
			//   - Allow private names with leading underscore (_secret, _MY_CONST, __privateVar)
			"id-match": [
				"error",
				"^(_{0,2}[a-z][a-zA-Z0-9]*|_{0,2}[A-Z][A-Z0-9_]*|_{0,2}[A-Z][a-zA-Z0-9]*)$",
				{ properties: true, onlyDeclarations: true },
			],

			// Allow leading underscores for private variables/members
			"no-underscore-dangle": "off",


			/* --- Code Style --- */
			// Enforce consistent indentation (configured globally as 1 tab = 4 spaces)
			"indent": "error",

			// Require semicolons at the end of statements
			"semi": ["error", "always"],

			// Enforce double quotes for strings; single quotes allowed only if escaping needed
			"quotes": ["error", "double", { avoidEscape: true }],

			// Disable strict line length limit (keep reasonable by convention)
			"max-len": ["off"],


			/* --- Functions --- */
			// Warn if a function exceeds 150 lines (ignores comments and blank lines, skip test files)
			"max-lines-per-function": ["warn", { max: 150, skipComments: true, skipBlankLines: true }],

			// Warn if cyclomatic complexity (branches/paths) exceeds 20
			"complexity": ["warn", { max: 20 }],


			/* --- Error Handling --- */
			// Disallow unnecessary `return await` inside async functions
			"no-return-await": "error",


			/* --- Comments & JSDoc --- */
			// Warn if functions, methods, or classes are missing JSDoc blocks
			"jsdoc/require-jsdoc": [
				"warn",
				{
					require: {
						FunctionDeclaration: true,
						MethodDefinition: true,
						ClassDeclaration: true,
					},
				},
			],

			// Warn if @param tags are missing in JSDoc for function parameters
			"jsdoc/require-param": "warn",

			// Warn if @returns tag is missing in JSDoc for functions with a return value
			"jsdoc/require-returns": "warn",


			/* --- TypeScript Specific --- */
			// Warn if return type is missing, except for inline/arrow functions
			"@typescript-eslint/explicit-function-return-type": [
				"warn",
				{ allowExpressions: true, allowTypedFunctionExpressions: true },
			],

			// Warn when using the `any` type (prefer stricter typing)
			"@typescript-eslint/no-explicit-any": "warn",

			// Warn for unused variables, but allow `_` prefix to mark intentional unused vars
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],

			// Enforce using `interface` instead of `type` for object shape definitions
			"@typescript-eslint/consistent-type-definitions": ["error", "interface"],

			// Enforce `import type` when importing only types for cleaner TS builds
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},
	{
		files: ["**/Tests/**/*.ts"],
		rules: {
			"max-lines-per-function": "off",
			"@typescript-eslint/no-explicit-any": "off",
		}
	}
]);