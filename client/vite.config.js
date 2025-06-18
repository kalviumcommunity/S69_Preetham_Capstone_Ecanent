import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: '/',
  assetsInclude: ["**/pdf.worker.min.js", "**/pdf.worker.js"],
    server: {
        watch: {
            usePolling: true, 
        },
    },
    build: {
        rollupOptions: {
            external: [/pdf\.worker\.(min\.)?js$/],
        },
    },
})
