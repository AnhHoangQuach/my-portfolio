import { SkillGroup } from '@/types'

export const skillGroups: SkillGroup[] = [
  {
    title: 'Frontend',
    icon: 'monitor',
    skills: [
      { name: 'Next.js', highlighted: true },
      { name: 'React', highlighted: true },
      { name: 'TypeScript' },
      { name: 'Vue.js' },
      { name: 'Vite' },
      { name: 'Redux' },
      { name: 'Tailwind CSS' },
    ],
  },
  {
    title: 'Backend',
    icon: 'terminal',
    skills: [
      { name: 'Node.js / NestJS', highlighted: true },
      { name: 'Golang' },
      { name: 'Laravel' },
      { name: 'Spring Boot' },
      { name: 'REST API' },
      { name: 'Microservices' },
      { name: 'Event-driven Architecture' },
    ],
  },
  {
    title: 'Data & Messaging',
    icon: 'database',
    skills: [
      { name: 'PostgreSQL', highlighted: true },
      { name: 'MongoDB' },
      { name: 'Redis' },
      { name: 'Kafka', highlighted: true },
      { name: 'RabbitMQ' },
      { name: 'BullMQ' },
      { name: 'MQTT' },
      { name: 'WebSocket' },
    ],
  },
  {
    title: 'DevOps & Infrastructure',
    icon: 'cloud',
    skills: [
      { name: 'Docker' },
      { name: 'Kubernetes' },
      { name: 'AWS' },
      { name: 'Jenkins' },
      { name: 'CI/CD' },
      { name: 'ELK Stack' },
      { name: 'Terraform' },
      { name: 'Argo CD' },
    ],
  },
  {
    title: 'Quality & Practices',
    icon: 'shield-check',
    skills: [
      { name: 'Performance Optimization' },
      { name: 'SQL Tuning' },
      { name: 'Load Testing' },
      { name: 'Security' },
      { name: 'Code Review' },
      { name: 'Agile / Scrum' },
    ],
  },
]
