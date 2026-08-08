import { Principle } from '@/types'

export const principles: Principle[] = [
  {
    n: '01',
    title: 'Keep systems simple.',
    body: 'Every service, queue and cache layer is a thing someone has to operate at 2am. Add one only when the workload demands it, and be able to say what breaks if you remove it.',
  },
  {
    n: '02',
    title: 'Design for failure.',
    body: 'Brokers drop, databases fail over, third-party APIs time out. HA setups, retries and idempotent consumers are cheaper to build up front than to retrofit during an incident.',
  },
  {
    n: '03',
    title: 'Performance is a feature.',
    body: 'A 30–50% cut in API time comes from measuring the query, not from rewriting the framework. Profile, fix the hot path, prove the delta.',
  },
  {
    n: '04',
    title: 'Observability is not optional.',
    body: 'If a bug can only be reproduced by a user, the system is under-instrumented. Structured logs, traces and load baselines turn incidents into short conversations.',
  },
  {
    n: '05',
    title: 'Good architecture enables change.',
    body: 'The point of boundaries is that the next requirement lands in one place. Code reviews and design docs are how a team keeps that property as it grows.',
  },
]
