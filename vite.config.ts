import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    watch: {
      usePolling: true, // Força verificação cíclica de mudanças (resolve problema WSL)
    },
    host: true, // Expõe servidor na rede local (WSL → Windows)
    strictPort: true,
    port: 5173,
  },
})
