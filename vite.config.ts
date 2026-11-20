import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { BRAND } from './src/config/brand.ts'

/** The home screen manifest, built from src/config/brand.ts so the name is set in one place. */
const manifest = JSON.stringify(
  {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#F2F5FA',
    theme_color: '#F2F5FA',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  null,
  2,
)

function brand(): Plugin {
  return {
    name: 'brand',
    transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', BRAND.name).replaceAll('%BRAND_TAGLINE%', BRAND.tagline),
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('content-type', 'application/manifest+json')
        res.end(manifest)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), brand()],
})
