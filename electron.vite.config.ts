import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        external: ['electron', 'fs', 'os', 'path', 'util', 'sql.js'],
        input: {
          index: resolve(__dirname, 'src/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        external: ['electron'],
        input: {
          index: resolve(__dirname, 'src/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: 'src',
    plugins: [react()],
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/index.html')
        }
      }
    }
  }
})
