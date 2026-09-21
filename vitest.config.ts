import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['**/*.{test,spec,bench}.?(c|m)[jt]s?(x)'],
        testTimeout: 120_000,
    },
});
