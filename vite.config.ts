import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          if (process.env.IS_DEV) {
            options.startup()
          }
        },
        vite: {
          build: {
            sourcemap: isProduction ? false : true,
            minify: isProduction ? 'esbuild' : false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['sqlite3', 'electron'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            sourcemap: isProduction ? false : 'inline',
            minify: isProduction ? 'esbuild' : false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: isProduction ? false : true,
    minify: isProduction ? 'esbuild' : false,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        menubar: path.resolve(__dirname, 'menubar.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})