import { ExpertiseArea } from '@/types'

export const expertiseAreas: ExpertiseArea[] = [
  {
    n: '01',
    icon: 'backend',
    title: 'Backend',
    note: 'Service design in NestJS and Go, message-driven boundaries, and API surfaces that stay honest under load.',
    items: ['NodeJS', 'NestJS', 'Golang', 'Spring Boot', 'Laravel', 'Python'],
  },
  {
    n: '02',
    icon: 'frontend',
    title: 'Frontend',
    note: 'Typed React and Vue applications, with bundle size and API call count treated as budgets.',
    items: ['ReactJS', 'NextJS', 'VueJS', 'TypeScript', 'Redux', 'Vite'],
  },
  {
    n: '03',
    icon: 'data',
    title: 'Data & Messaging',
    note: 'Relational modelling and query tuning first; queues and streams when the workload genuinely needs decoupling.',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ', 'BullMQ', 'MQTT'],
  },
  {
    n: '04',
    icon: 'cloud',
    title: 'Cloud & DevOps',
    note: 'Reproducible builds, traceable images, rollback-friendly deploys — the pipeline is part of the product.',
    items: ['Docker', 'Kubernetes', 'AWS', 'Argo CD', 'Jenkins', 'Terraform'],
  },
  {
    n: '05',
    icon: 'architecture',
    title: 'Architecture',
    note: 'Microservices with real boundaries, centralised identity, and caching that survives more than one instance.',
    items: ['Microservices', 'Event-driven', 'Keycloak', 'Distributed cache', 'HA / failover'],
  },
  {
    n: '06',
    icon: 'testing',
    title: 'Testing & Observability',
    note: 'Load characteristics measured before release; production failures traced, not guessed at.',
    items: ['Cypress', 'Playwright', 'JMeter', 'ELK Stack', 'Load testing'],
  },
]
