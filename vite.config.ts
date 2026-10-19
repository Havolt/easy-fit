import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['panda.svg'],
        manifest: {
          name: 'Simple Diet',
          short_name: 'Simple Diet',
          description: 'A simple offline diet and exercise progress tracker.',
          theme_color: '#f5f1e8',
          background_color: '#f5f1e8',
          display: 'standalone',
          icons: [
            { src: 'panda.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
      }),
    ],
  };
});
