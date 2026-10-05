import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { azureDevOpsApiPlugin } from './server/azureDevOps/plugin.ts';

export default defineConfig({
  plugins: [react(), azureDevOpsApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['@poliedro/tamentai/web'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    alias: {
      '@poliedro/tamentai/web': fileURLToPath(
        new URL('./src/test/tamentaiWebMock.tsx', import.meta.url),
      ),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/test/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/types/**',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
