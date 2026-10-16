import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { devApi } from './server/devApi'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [react(), devApi()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
})
