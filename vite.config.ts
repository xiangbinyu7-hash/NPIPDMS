import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['xlsx'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      './cptable': 'xlsx/dist/cpexcel.full.mjs',
    },
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  server: {
    historyApiFallback: true,
    hmr: {
      overlay: true,
    },
  },
  preview: {
    historyApiFallback: true,
  },
});
