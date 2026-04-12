export const siteConfig = {
  name: 'Quach Hoang Anh',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hayes.io.vn',
  ogImage: '/og-image.png',
  description:
    'Senior Fullstack Engineer specializing in React, Next.js, Node.js, Golang, Kafka & AWS. Building high-performance distributed systems and pixel-perfect interfaces for enterprise and startups.',
  links: {
    github: 'https://github.com/quachhoanganh',
    linkedin: 'https://linkedin.com/in/quachhoanganh',
    twitter: 'https://twitter.com/quachhoanganh',
  },
} as const

export type SiteConfig = typeof siteConfig
