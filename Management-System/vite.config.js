import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/mixins.scss" as *;`
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:1145',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:1145',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:1145',
        changeOrigin: true
      }
    }
  }
})
