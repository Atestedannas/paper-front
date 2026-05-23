import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8002',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:8002',
          changeOrigin: true,
        }
      }
    }
  }
})
