import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Automatically detect GitHub Pages base URL:
  // 1. Explicit BASE_URL from env
  // 2. Extracted from GitHub Actions GITHUB_REPOSITORY (e.g. "owner/greenapp" -> "/greenapp/")
  // 3. Fallback for production: "/greenapp/"
  // 4. Local dev: "/"
  const ghRepo = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : null;
  const base = process.env.BASE_URL || ghRepo || (process.env.NODE_ENV === 'production' ? '/app-v9.1.1.3/' : '/');

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
