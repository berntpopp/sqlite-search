import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // Exclude E2E tests - they run with Playwright, not Vitest
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'dist-electron/',
        '**/*.config.js',
        '**/*.config.ts',
        '**/mockData.js',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
