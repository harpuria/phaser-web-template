import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { resolvePlatformTarget } from './src/config/platform.ts';

export default defineConfig(({ command, mode }) => ({
  base: './',
  define: {
    'import.meta.env.VITE_PLATFORM': JSON.stringify(
      // Builds must name their host; the dev server keeps CrazyGames as its default.
      resolvePlatformTarget(
        loadEnv(mode, process.cwd()).VITE_PLATFORM,
        mode,
        command === 'build',
      ),
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
