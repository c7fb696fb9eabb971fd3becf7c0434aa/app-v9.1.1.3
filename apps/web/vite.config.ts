import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { API_PATHS } from '@greendocs/contracts/api-paths';
import { resolveWebBuildConfig } from './config';

const workspaceRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig(({ mode }) => {
  const config = resolveWebBuildConfig(mode, {
    ...loadEnv(mode, workspaceRoot, ''),
    ...process.env,
  });

  return {
    envDir: workspaceRoot,
    base: config.pagesBase,
    plugins: [react(), tailwindcss()],
    server: {
      port: config.webPort,
      strictPort: true,
      proxy: {
        [API_PATHS.apiPrefix]: config.apiProxyTarget,
      },
    },
  };
});
