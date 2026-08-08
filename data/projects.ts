import { Project } from '@/types'

export const projects: Project[] = [
  {
    tag: 'GLORY SOFTWARE · CASH HANDLING',
    title: 'UBIQULAR Inform',
    meta: 'NestJS · Kafka · MQTT · PostgreSQL',
    problem:
      'Cash-handling machines in the field emit a constant stream of device, inventory and fault telemetry. Operators needed one view of what was happening across the estate, and the query paths behind that view were too slow to sit in front of a dashboard.',
    solution:
      'Ingest device events over MQTT into Kafka, process them in workers, and serve the operator view from a read path tuned for it. Redis carries hot state across instances so the distributed deployment stays consistent. MQTT simulation tooling plus JMeter load tests set the performance baseline before release.',
    nodes: [
      { name: 'devices', sub: 'MQTT telemetry' },
      { name: 'broker', sub: 'Kafka topics' },
      { name: 'workers', sub: 'NestJS consumers' },
      { name: 'postgres', sub: 'read models' },
      { name: 'inform UI', sub: 'operator view' },
    ],
    techStack: ['NestJS', 'Kafka', 'MQTT', 'PostgreSQL', 'Redis', 'RxJS', 'JMeter'],
    impact: [
      { value: '30–50%', label: 'faster API responses after SQL and query tuning' },
      { value: '0', label: 'open pentest findings at handover' },
    ],
  },
  {
    tag: 'AIRDATA · AIRLINE TICKETING',
    title: 'Agency & retail ticket platform',
    meta: 'Microservices · Keycloak · ELK · LangChain',
    problem:
      'Two ticket-selling products — agency and retail — sat on top of legacy airline and rail APIs speaking SOAP. Auth was inconsistent across services, the frontend shipped too much JavaScript, and agents spent hours re-keying ticket data by hand.',
    solution:
      'Consolidated identity behind Keycloak for every microservice, wrapped the SOAP integrations in typed service boundaries, trimmed bundle size and API chatter on the client, and put a LangChain automation in front of ticket-data extraction and validation. ELK made production failures traceable instead of anecdotal.',
    nodes: [
      { name: 'agencies', sub: 'web clients' },
      { name: 'keycloak', sub: 'authn / authz' },
      { name: 'services', sub: 'ticket · noti' },
      { name: 'SOAP APIs', sub: 'airline · rail' },
      { name: 'ELK', sub: 'trace · alert' },
    ],
    techStack: ['NodeJS', 'VueJS', 'Keycloak', 'ELK Stack', 'LangChain', 'WordPress'],
    impact: [
      { value: '25%', label: 'less manual agent time on ticket data' },
      { value: 'Sprintly', label: 'dependency upgrades closing CVEs' },
    ],
  },
  {
    tag: 'AIARACORP · KOREAN MARKET',
    title: 'TIMART live auction',
    meta: 'NextJS · Redux · Agora · AWS ECR',
    problem:
      'A commerce auction where several buyers compete for the same goods in real time, on a map-driven interface, for a Korean client with a hard launch date. Contention had to resolve correctly and the release path had to be reversible.',
    solution:
      'Built the map and bidding flow in Next.js with Redux holding auction state, Agora for in-auction chat and FCM for push. Delivery ran through AWS ECR and Docker with a CI/CD workflow designed for traceable, rollback-friendly releases across staging and production.',
    nodes: [
      { name: 'buyers', sub: 'NextJS client' },
      { name: 'realtime', sub: 'socket · Agora' },
      { name: 'auction', sub: 'bid resolution' },
      { name: 'FCM', sub: 'push' },
    ],
    techStack: ['NextJS', 'TypeScript', 'Redux', 'Agora', 'FCM', 'Docker', 'AWS ECR'],
    impact: [
      { value: 'Rollback', label: 'safe releases via ECR image workflow' },
      { value: 'Real-time', label: 'concurrent bidding without lost updates' },
    ],
  },
]
