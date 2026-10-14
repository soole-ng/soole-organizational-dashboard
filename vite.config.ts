import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // admindashboard.soole.ng installs as its own app, not as a second copy
  // of the company dashboard.
  const isAdminSite = (process.env.VITE_APP_MODE ?? loadEnv(mode, process.cwd()).VITE_APP_MODE) === 'admin'
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: isAdminSite ? 'Soole Ops - staff' : 'Soole Operator Dashboard',
        short_name: isAdminSite ? 'Soole Staff' : 'Soole Ops',
        description: isAdminSite
          ? 'Live trips across Soole, for Soole staff'
          : 'Manage your transport business on Soole',
        theme_color: '#042011',
        background_color: '#042011',
        display: 'standalone',
        orientation: isAdminSite ? 'any' : 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    rollupOptions: {
      output: {
        // recharts and jspdf were landing inside whichever page chunk
        // first imported them (measured: a 412kB ReportsPage chunk) -
        // splitting them into their own vendor chunks means pages that
        // don't use charts/PDF export (Settings, Drivers, ...) don't pay
        // to parse them. mapbox-gl/react-map-gl are listed as
        // dependencies but aren't actually imported anywhere in src/ (Live
        // Map renders without them) - not worth a manualChunks entry that
        // would just produce an empty chunk.
        manualChunks: {
          charts: ['recharts'],
          pdf: ['jspdf'],
        },
      },
    },
  },
}
})
