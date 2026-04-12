import { SkillGroup } from '@/types'

export const skillGroups: SkillGroup[] = [
  {
    title: 'Frontend Core',
    icon: 'monitor',
    skills: [
      { name: 'React 18', highlighted: true },
      { name: 'Next.js' },
      { name: 'Vue.js' },
      { name: 'TypeScript' },
      { name: 'Tailwind CSS' },
      { name: 'Redux Toolkit' },
    ],
  },
  {
    title: 'Backend',
    icon: 'terminal',
    skills: [
      { name: 'Node.js / NestJS' },
      { name: 'Golang (Gin/Fiber)' },
      { name: 'Microservices Arch' },
    ],
  },
  {
    title: 'Infra & Ops',
    icon: 'cloud',
    skills: [{ name: 'AWS' }, { name: 'Docker' }, { name: 'Kubernetes' }, { name: 'CI/CD' }],
  },
  {
    title: 'Data & Event Mesh',
    icon: 'database',
    skills: [
      { name: 'Kafka', highlighted: true },
      { name: 'PostgreSQL' },
      { name: 'Redis' },
      { name: 'MongoDB' },
      { name: 'Elasticsearch' },
    ],
  },
]
