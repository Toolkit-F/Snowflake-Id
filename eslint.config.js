import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    // Base ESLint recommended rules
    eslint.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,

    // Prettier integration (disables conflicting rules)
    prettierConfig,

    // Global ignores
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '*.config.js',
            '*.config.ts',
        ],
    },

    // TypeScript source files
    {
        files: ['src/**/*.ts'],
        plugins: {
            prettier,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Prettier as ESLint rule
            'prettier/prettier': 'error',

            // TypeScript specific rules
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

            // Code quality
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
        },
    },

    // Test files (relaxed rules)
    {
        files: ['tests/**/*.ts', 'tests/**/*.mjs', 'tests/**/*.js'],
        plugins: {
            prettier,
        },
        languageOptions: {
            globals: {
                process: 'readonly',
                console: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
            },
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off',
        },
    },
);
