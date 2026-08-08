export const siteConfig = {
  name: 'Quach Hoang Anh',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hayes.io.vn',
  ogImage: '/og-image.png',
  description:
    'Senior Software Engineer specializing in NestJS, Go, React & Next.js on Kafka, PostgreSQL, Redis and Kubernetes. Building scalable web platforms, real-time systems, and business-critical products.',
  links: {
    github: 'https://github.com/AnhHoangQuach',
    linkedin: 'https://linkedin.com/in/quach-hoang-anh/',
  },
} as const
