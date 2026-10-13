import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { resolveWebBuildConfig } from './config.ts';

const workspaceRoot = import.meta.dirname;

export default defineConfig(({ mode }) => {
  const config = resolveWebBuildConfig(mode, {
    ...loadEnv(mode, workspaceRoot, ''),
    ...process.env,
  });

  return {
    envDir: workspaceRoot,
    base: config.pagesBase,
    plugins: [react(), tailwindcss()],
    server: { port: config.webPort, strictPort: true },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx', '*.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
