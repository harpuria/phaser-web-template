import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { resolvePlatformTarget } from './src/config/platform.ts';

export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    'import.meta.env.VITE_PLATFORM': JSON.stringify(
      resolvePlatformTarget(loadEnv(mode, process.cwd()).VITE_PLATFORM, mode),
    ),
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id: string) =>
          id.includes('/node_modules/phaser/') ? 'phaser' : undefined,
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  test: { include: ['tests/unit/**/*.test.ts'] },
}));
