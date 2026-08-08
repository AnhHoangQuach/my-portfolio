import { pipelineStats } from '@/data/hero'

const BOX = 'font-mono text-[10.5px]'

/**
 * Hero "event pipeline" schematic: devices/clients → gateway → ingest/workers
 * → Postgres/Redis, with the edges animated as travelling dashes.
 */
export function PipelineCard({ title }: { title: string }) {
  return (
    <div className="bg-panel-gradient flex flex-col overflow-hidden rounded-2xl border border-hairline shadow-panel">
      <div className="border-b border-hairline px-4 py-3.5 font-mono text-[0.72rem] tracking-[0.08em] text-faint">
        {title}
      </div>

      <div className="flex-1 p-3.5">
        <svg
          viewBox="0 0 520 250"
          className="block h-full min-h-60 w-full"
          role="img"
          aria-label="System architecture: devices and clients feed a gateway, which streams over Kafka into ingest and worker services backed by PostgreSQL and Redis."
        >
          <defs>
            {/* userSpaceOnUse, spanning the diagram: the default
                objectBoundingBox units give a purely horizontal path a
                zero-height box, and a degenerate box paints nothing — which
                silently dropped the gateway → ingest/workers edge. Absolute
                coordinates also make the ramp run across the whole diagram
                instead of restarting on every segment. */}
            <linearGradient
              id="hero-edge"
              gradientUnits="userSpaceOnUse"
              x1="16"
              y1="0"
              x2="512"
              y2="0"
            >
              <stop offset="0%" stopColor="var(--brand-cyan)" />
              <stop offset="55%" stopColor="var(--brand-blue)" />
              <stop offset="100%" stopColor="var(--brand-violet)" />
            </linearGradient>
          </defs>

          <g stroke="url(#hero-edge)" strokeWidth="1.4" fill="none" opacity="0.85">
            <path className="anim-flow" d="M96 60 H190 V118" strokeDasharray="7 9" />
            <path
              className="anim-flow"
              d="M96 190 H190 V132"
              strokeDasharray="7 9"
              style={{ animationDuration: '7s' }}
            />
            <path
              className="anim-flow"
              d="M262 125 H330"
              strokeDasharray="7 9"
              style={{ animationDuration: '5s' }}
            />
            <path
              className="anim-flow"
              d="M402 110 H452 V62 H468"
              strokeDasharray="7 9"
              style={{ animationDuration: '6.5s' }}
            />
            <path
              className="anim-flow"
              d="M402 140 H452 V196 H468"
              strokeDasharray="7 9"
              style={{ animationDuration: '8s' }}
            />
          </g>

          <g className={BOX} fill="var(--dim)">
            <rect
              x="16"
              y="42"
              width="80"
              height="36"
              rx="9"
              fill="var(--brand-cyan)"
              fillOpacity="0.08"
              stroke="var(--brand-cyan)"
              strokeOpacity="0.45"
            />
            <text x="56" y="64" textAnchor="middle">
              devices
            </text>

            <rect
              x="16"
              y="172"
              width="80"
              height="36"
              rx="9"
              fill="var(--brand-cyan)"
              fillOpacity="0.08"
              stroke="var(--brand-cyan)"
              strokeOpacity="0.45"
            />
            <text x="56" y="194" textAnchor="middle">
              clients
            </text>

            <rect
              x="190"
              y="106"
              width="72"
              height="38"
              rx="9"
              fill="var(--brand-blue)"
              fillOpacity="0.12"
              stroke="var(--brand-blue)"
              strokeOpacity="0.5"
            />
            <text x="226" y="129" textAnchor="middle">
              gateway
            </text>

            <rect
              x="330"
              y="92"
              width="72"
              height="34"
              rx="9"
              fill="var(--brand-blue)"
              fillOpacity="0.12"
              stroke="var(--brand-blue)"
              strokeOpacity="0.5"
            />
            <text x="366" y="113" textAnchor="middle">
              ingest
            </text>

            <rect
              x="330"
              y="132"
              width="72"
              height="34"
              rx="9"
              fill="var(--brand-blue)"
              fillOpacity="0.12"
              stroke="var(--brand-blue)"
              strokeOpacity="0.5"
            />
            <text x="366" y="153" textAnchor="middle">
              workers
            </text>

            <rect
              x="468"
              y="44"
              width="44"
              height="34"
              rx="9"
              fill="var(--brand-violet)"
              fillOpacity="0.14"
              stroke="var(--brand-violet)"
              strokeOpacity="0.55"
            />
            <text x="490" y="65" textAnchor="middle">
              pg
            </text>

            <rect
              x="468"
              y="178"
              width="44"
              height="34"
              rx="9"
              fill="var(--brand-violet)"
              fillOpacity="0.14"
              stroke="var(--brand-violet)"
              strokeOpacity="0.55"
            />
            <text x="490" y="199" textAnchor="middle">
              redis
            </text>
          </g>

          <g fill="var(--faint)" className="font-mono text-[9px]">
            <text x="226" y="164" textAnchor="middle">
              MQTT · REST
            </text>
            <text x="366" y="184" textAnchor="middle">
              Kafka
            </text>
          </g>
        </svg>
      </div>

      <div className="flex border-t border-hairline">
        {pipelineStats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 border-r border-hairline px-4 py-3.5 last:border-r-0"
          >
            <div className="font-heading text-lg font-semibold text-foreground">{stat.value}</div>
            <div className="mt-1 text-[0.69rem] text-faint">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
