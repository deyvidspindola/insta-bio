import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/site/main.tsx',
                'resources/js/app/main.tsx',
                'resources/js/editor/main.tsx',
                'resources/js/editor/preview/main.tsx',
                'resources/js/admin/main.tsx',
                'resources/js/bio/main.tsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@bio-types': path.resolve(import.meta.dirname, 'resources/js/bio/types/bio.ts'),
            '@site': path.resolve(import.meta.dirname, 'resources/js/bio'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
        // A página roda em :8000 e os módulos em :5173 — sem CORS o browser bloqueia e a tela fica em branco.
        cors: {
            origin: [
                'http://localhost:8000',
                'http://127.0.0.1:8000',
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ],
        },
        hmr: {
            host: 'localhost',
            port: 5173,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
            usePolling: process.env.VITE_USE_POLLING === 'true',
        },
    },
});
