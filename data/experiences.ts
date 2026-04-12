import { Experience } from '@/types'

export const experiences: Experience[] = [
  {
    company: 'GLORY SOFTWARE',
    role: 'Senior Fullstack Engineer',
    duration: '2022 — Present',
    startYear: 2022,
    endYear: 'Present',
    description:
      'Architected core backend using NestJS and Kafka for high-concurrency event processing. Optimized critical API endpoints, resulting in a 30-50% reduction in response latency and improved system reliability.',
    achievements: [
      'Architected event-driven backend with NestJS + Kafka processing 100k+ events/day',
      'Reduced API response latency by 30-50% through query optimization and caching',
      'Led migration from monolith to microservices architecture',
      'Mentored 3 junior developers and established code review standards',
    ],
    techStack: ['NestJS', 'Kafka', 'React', 'PostgreSQL', 'Docker', 'AWS'],
  },
  {
    company: 'AIRDATA',
    role: 'Engineering Team Lead',
    duration: '2020 — 2022',
    startYear: 2020,
    endYear: 2022,
    description:
      'Led a team of 6 to rebuild a legacy airline ticketing system. Migrated on-prem infrastructure to AWS EKS (Kubernetes), ensuring 99.99% uptime during peak holiday seasons.',
    achievements: [
      'Led team of 6 engineers rebuilding legacy airline ticketing system',
      'Migrated on-prem infrastructure to AWS EKS with zero downtime',
      'Achieved 99.99% uptime during peak holiday booking seasons',
      'Implemented CI/CD pipelines reducing deployment time by 70%',
    ],
    techStack: ['Go', 'AWS', 'Kubernetes', 'Redis', 'gRPC', 'Jenkins'],
  },
  {
    company: 'AIARACORP',
    role: 'Fullstack Developer',
    duration: '2018 — 2020',
    startYear: 2018,
    endYear: 2020,
    description:
      'Developed high-conversion e-commerce interfaces. Leveraged Supabase for real-time inventory management and optimized SEO/Performance to achieve a 95+ Google Lighthouse score.',
    achievements: [
      'Built high-conversion e-commerce platform serving 50k+ monthly users',
      'Achieved 95+ Google Lighthouse score across all metrics',
      'Implemented real-time inventory management with Supabase',
      'Designed and built responsive UI component library from scratch',
    ],
    techStack: ['React', 'Node.js', 'Supabase', 'TypeScript', 'Next.js'],
  },
]
