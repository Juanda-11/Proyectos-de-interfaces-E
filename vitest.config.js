import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.mjs'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.*'],
        reporter: ['text', 'lcov'],
      },
    },
  }),
)
