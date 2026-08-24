import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function clarityStylesheetUnmask(): Plugin {
  return {
    name: 'clarity-stylesheet-unmask',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi,
          (tag) => tag.includes('data-clarity-unmask')
            ? tag
            : tag.replace(/\s*\/?>$/, (ending) =>
              ending.includes('/')
                ? ' data-clarity-unmask="true" />'
                : ' data-clarity-unmask="true">'),
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clarityStylesheetUnmask()],
  build: {
    // Clarity replays can outlive a deployment. A stable CSS URL keeps old
    // recordings styled after Vite's hashed JS bundles have been replaced.
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith('.css'))
            ? 'assets/app.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
