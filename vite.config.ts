/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base works both at the interim project URL (renresear.ch/ccdr/) and at
// the final apex (ccdr.dev/) — no base swap needed when DNS is wired up.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: { provider: 'v8', include: ['src/engine/**', 'src/config/**'] },
  },
})
