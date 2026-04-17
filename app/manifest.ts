import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quach Hoang Anh — Senior Full-Stack Developer | hayes.io.vn',
    short_name: 'Hayes Portfolio',
    description:
      'Senior Full-Stack Developer specializing in Next.js, React, TypeScript, Node.js, NestJS & AWS. Portfolio of Quach Hoang Anh.',
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
