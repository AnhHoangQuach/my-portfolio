import { Project } from '@/types'

export const projects: Project[] = [
  {
    title: 'UBIQULAR Inform',
    subtitle: 'Monitoring & Operations Platform',
    description:
      'A monitoring and operations platform for cash activity, device usage, inventory visibility, and technical issue tracking. Optimized SQL queries and reduced API response time by 30–50%. Built MQTT-based tooling and resolved security vulnerabilities.',
    imageUrl: '/images/project-dashboard.svg',
    techStack: ['NestJS', 'PostgreSQL', 'Kafka', 'MQTT', 'Redis', 'RxJS', 'JMeter'],
    liveUrl: '#',
    caseStudyUrl: '#',
  },
  {
    title: 'Airdata Ticketing Platforms',
    subtitle: 'Airline & Retail Ticketing',
    description:
      'Airline and retail ticketing platforms serving agencies and operational teams. Implemented services integrating airline APIs, improved frontend performance, and built deployment workflows with Kubernetes and Argo CD. Reduced API latency by 20–30%.',
    imageUrl: '/images/project-airline.svg',
    techStack: ['Vue.js', 'Node.js', 'PostgreSQL', 'ELK Stack', 'Keycloak', 'AWS', 'Kubernetes'],
    caseStudyUrl: '#',
  },
  {
    title: 'TIMART',
    subtitle: 'E-commerce & Auction Platform',
    description:
      'A Korean e-commerce and auction-related platform. Built and fixed features using React, TypeScript, and Redux. Integrated real-time chat with Agora and push notifications with FCM. Handled competitive purchase flows for e-commerce scenarios.',
    imageUrl: '/images/project-ecommerce.svg',
    techStack: ['React', 'TypeScript', 'Redux', 'Agora', 'FCM'],
  },
  {
    title: 'Blockchain / Web3 Products',
    subtitle: 'NFT & Crypto Platforms',
    description:
      'Multiple blockchain-related products including dashboards, NFT marketplaces, payment systems, and bots. Built dashboard APIs and crypto payment gateway services with NestJS. Developed NFT marketplace functionality and Slack/Discord bots using Golang.',
    imageUrl: '/images/project-blockchain.svg',
    techStack: ['NestJS', 'Golang', 'Gin', 'REST', 'Blockchain'],
  },
]
