import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            '@causaloop/core': '/Users/name/trusted-git/public-repos/battle-tester/causaloop-repo/packages/core/src',
            '@causaloop/platform-browser': '/Users/name/trusted-git/public-repos/battle-tester/causaloop-repo/packages/platform-browser/src',
        },
    },
});
