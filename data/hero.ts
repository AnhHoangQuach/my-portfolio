import { Stat, TerminalLine } from '@/types'

/** The looping shell transcript rendered in the hero terminal card. */
export const terminalScript: TerminalLine[] = [
  { prompt: '$ ', text: 'whoami', tone: 'command' },
  { prompt: '', text: 'quach hoang anh — full-stack engineer, 5 yrs', tone: 'output' },
  { prompt: '$ ', text: 'systems --running', tone: 'command' },
  {
    prompt: '',
    text: 'cash-handling telemetry · airline ticketing · nft marketplace',
    tone: 'output',
  },
  { prompt: '$ ', text: 'perf --diff last-sprint', tone: 'command' },
  { prompt: '', text: 'api p95   ▇▇▇▇▇   -30..50%', tone: 'accent' },
  { prompt: '$ ', text: 'status', tone: 'command' },
  { prompt: '', text: 'open to senior / lead roles ⏻', tone: 'violet' },
]

/** Stats printed along the bottom of the hero pipeline card. */
export const pipelineStats: Stat[] = [
  { value: '30–50%', label: 'API latency cut' },
  { value: '99.9%', label: 'HA target, DB + cache' },
  { value: '6', label: 'teams shipped with' },
]
