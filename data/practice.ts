import { PracticeItem } from '@/types'

export const practiceItems: PracticeItem[] = [
  {
    kicker: 'Team',
    title: 'Leading without becoming the bottleneck',
    body: 'At Glory I led a sub-team through daily technical decisions and set the code quality bar in review. At s6k Labs I led delivery and brought interns and freshers up to shipping standard. The goal in both cases was the same: fewer decisions that only I could make.',
  },
  {
    kicker: 'Review',
    title: 'Reviews that change the design, not the whitespace',
    body: 'Structured review with an explicit standard — boundaries, failure handling, query cost, test coverage. Comments arrive early enough to matter, and disagreements go to a design doc rather than a longer thread.',
  },
  {
    kicker: 'Delivery',
    title: 'Owning the path to production',
    body: 'GitLab and Harbor at s6k Labs, AWS ECR and Docker workflows at AIARACORP, Argo CD and Jenkins on Kubernetes. Every release traceable to an image and reversible without a war room.',
  },
  {
    kicker: 'Rigor',
    title: 'Security and upgrades on a schedule',
    body: 'Sprint-cadence dependency upgrades to close known vulnerabilities at Airdata; pentest findings on cash-handling software closed at Glory. Neither is glamorous work, and both are the difference between a product and a liability.',
  },
  {
    kicker: 'Documentation',
    title: 'Writing the system down',
    body: 'System analysis and design documents before implementation on client work, so the decision and its trade-off outlive the sprint it was made in.',
  },
  {
    kicker: 'Automation',
    title: 'Removing the repetitive work',
    body: 'AI-assisted scripts for repeated team tasks at AIARACORP, and a LangChain pipeline at Airdata that took 25% of the manual time out of ticket-data extraction and validation.',
  },
]
