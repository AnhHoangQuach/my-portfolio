import { Project } from '@/types'

export const projects: Project[] = [
  {
    title: 'UBIQULAR Inform',
    subtitle: 'Enterprise Cash Handling',
    description:
      'A mission-critical dashboard for global retailers to manage cash flows in real-time. Integrated complex banking APIs and created a suite of dynamic data visualization tools.',
    imageUrl: '/images/project-dashboard.svg',
    techStack: ['React', 'NestJS', 'PostgreSQL', 'Kafka', 'AWS', 'D3.js'],
    liveUrl: '#',
    caseStudyUrl: '#',
  },
  {
    title: 'Scalable Airline System',
    subtitle: 'High-Concurrency API',
    description:
      'Engineered a booking engine capable of handling 50k+ requests per second. Implemented a robust caching strategy with Redis and multi-region AWS deployment.',
    imageUrl: '/images/project-airline.svg',
    techStack: ['Go', 'Redis', 'AWS EKS', 'gRPC', 'PostgreSQL', 'React'],
    githubUrl: '#',
    caseStudyUrl: '#',
  },
]
