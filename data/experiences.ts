import { Experience } from '@/types'

export const experiences: Experience[] = [
  {
    company: 'GLORY SOFTWARE VIETNAM',
    role: 'Full-Stack Developer',
    duration: 'Mar 2025 — Present',
    startYear: 2025,
    endYear: 'Present',
    description:
      'Product company focused on software for cash handling machines and operational platforms. Developing backend services using NestJS, PostgreSQL, Kafka, MQTT, and Redis. Optimized SQL queries and reduced API response time by 30–50%.',
    achievements: [
      'Developed backend services with NestJS, PostgreSQL, Kafka, MQTT, RxJS, and SFTP',
      'Optimized SQL queries and reduced API response time by 30–50%',
      'Resolved security and pentest-related issues including session vulnerabilities',
      'Built MQTT-based tooling and load tested system behavior with JMeter',
      'Supported team as sub-team lead through code reviews and technical guidance',
    ],
    techStack: ['NestJS', 'PostgreSQL', 'Kafka', 'MQTT', 'Redis', 'RxJS'],
  },
  {
    company: 'AIARACORP',
    role: 'Full-Stack Developer',
    duration: 'Aug 2024 — Feb 2025',
    startYear: 2024,
    endYear: 2025,
    description:
      'Outsourcing company serving the Korean market. Built and fixed features for e-commerce and auction platforms using React, TypeScript, and Redux. Integrated real-time chat and push notifications.',
    achievements: [
      'Built and fixed features using React, TypeScript, and Redux',
      'Contributed to map-related functionality in auction workflows',
      'Integrated chat with Agora and push notifications with FCM',
      'Handled competitive purchase flows for e-commerce scenarios',
    ],
    techStack: ['React', 'TypeScript', 'Redux', 'Agora', 'FCM'],
  },
  {
    company: 'AIRDATA',
    role: 'Full-Stack Developer',
    duration: 'Jul 2023 — Feb 2025',
    startYear: 2023,
    endYear: 2025,
    description:
      'Airline ticket management and retail platform development. Implemented services integrating airline APIs, improved frontend performance, and built deployment workflows with Kubernetes and Argo CD.',
    achievements: [
      'Implemented services integrating airline APIs including SOAP-based services',
      'Improved frontend performance by reducing bundle size and unnecessary API calls',
      'Refactored code and reduced API latency by 20–30%',
      'Integrated Keycloak for user management in microservices architecture',
      'Built deployment workflows with Jenkins, Kubernetes, Harbor, and Argo CD',
    ],
    techStack: ['Vue.js', 'Node.js', 'PostgreSQL', 'ELK Stack', 'Keycloak', 'AWS', 'Kubernetes'],
  },
  {
    company: 'S6KLABS',
    role: 'Full-Stack Developer',
    duration: 'Mar 2022 — Jun 2023',
    startYear: 2022,
    endYear: 2023,
    description:
      'Consulting and delivery of blockchain-oriented solutions. Built dashboard APIs, crypto payment gateway services, NFT marketplace functionality, and Slack/Discord bots.',
    achievements: [
      'Built dashboard APIs and crypto payment gateway services with NestJS',
      'Developed NFT marketplace functionality and dashboard systems',
      'Built Slack bots and Discord bots using Golang',
      'Worked with microservice-based architectures using messaging and REST',
    ],
    techStack: ['NestJS', 'Golang', 'Gin', 'REST', 'Blockchain'],
  },
  {
    company: 'THEINFITECH',
    role: 'Software Developer',
    duration: 'Oct 2021 — Jun 2022',
    startYear: 2021,
    endYear: 2022,
    description:
      'Outsourcing projects for Japanese clients. Developed web application features and contributed to frontend and backend development across various client projects.',
    achievements: [
      'Developed web application features for Japanese market clients',
      'Contributed to frontend and backend across multiple projects',
    ],
    techStack: ['React', 'Node.js', 'TypeScript'],
  },
  {
    company: 'SPORES LABS',
    role: 'Software Developer',
    duration: 'Apr 2021 — Oct 2021',
    startYear: 2021,
    endYear: 2021,
    description:
      'GameFi, Metaverse, and Web3-related product development. Converted product designs into responsive UI implementations and worked with blockchain integrations.',
    achievements: [
      'Converted product designs into responsive UI implementations',
      'Worked with blockchain integrations and Web3 products',
      'Contributed to fast-moving product delivery across Web3-focused initiatives',
    ],
    techStack: ['React', 'TypeScript', 'Web3', 'Blockchain'],
  },
]
