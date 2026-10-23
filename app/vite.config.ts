/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { msw } from 'msw/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    // `pnpm dev:mock` serves the MSW worker script; it never reaches a build
    plugins: [react(), ...(mode === 'mock' ? [msw({ mode: 'worker-only' })] : [])],
    base: "./",
    server: {
        proxy: {
            '/api': {
                target: process.env.VACUULA_API ?? 'http://localhost:80',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
}))
