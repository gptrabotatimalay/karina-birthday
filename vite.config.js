import { defineConfig } from 'vite';

export default defineConfig({
    base: '/karina-birthday/',
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    }
});
