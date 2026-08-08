import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quach Hoang Anh — Senior Software Engineer | hayes.io.vn',
    short_name: 'Hayes Portfolio',
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#05070d',
    theme_color: '#2b56ff',
    // Derived from public/hayes-logo-light.png — the H monogram on the brand's
    // own light plate. `sizes` must match the file's real pixel dimensions,
    // so each entry points at a separately generated square.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Extra padding so Android's circle/squircle mask never clips the mark.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
