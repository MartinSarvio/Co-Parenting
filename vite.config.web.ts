import path from "path"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"

// Web-only build config for huska.dk
export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: './tailwind.config.web.js' }),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: 'public-web',
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
          // Let Vite naturally code-split other deps with their lazy chunks
          return undefined;
        }
      }
    }
  }
});
