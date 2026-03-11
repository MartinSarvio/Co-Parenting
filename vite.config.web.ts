import path from "path"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Web-only build config for huska.dk
export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist-web',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'web.html'),
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (id.includes('date-fns')) return 'date-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (id.includes('framer-motion')) return 'motion-vendor';
          if (id.includes('@radix-ui')) return 'radix-vendor';
          return 'vendor';
        }
      }
    }
  }
});
