import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quach Hoang Anh — Senior Fullstack Engineer | hayes.io.vn',
    short_name: 'Hayes Portfolio',
    description:
      'Senior Fullstack Engineer specializing in React, Next.js, Node.js, Golang, Kafka & AWS. Portfolio of Quach Hoang Anh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1326',
    theme_color: '#4d8eff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
