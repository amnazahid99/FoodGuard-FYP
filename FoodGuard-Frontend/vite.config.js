import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5001/api'
  const proxyTarget = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5001'
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(new URL(import.meta.url).pathname), './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
          },
        },
      },
    },
  }
})
