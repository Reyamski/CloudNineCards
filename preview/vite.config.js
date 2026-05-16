import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // F6: split vendor chunks so the main bundle drops below ~500 kB.
        // React/router + framer-motion + supabase are the heaviest deps;
        // give each its own chunk so cache hits across route navigations.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom') || id.match(/[\\/]react[\\/]/)) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@emailjs')) return 'vendor-email';
            return 'vendor';
          }
        },
      },
    },
  },
})
