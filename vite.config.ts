import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    // this makes process.env === actual Node process.env at build‐time
    'process.env': process.env
  }
})
