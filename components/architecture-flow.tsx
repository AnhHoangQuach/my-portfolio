import { cn } from '@/lib/utils'
import { ArchitectureNode } from '@/types'

/**
 * Horizontal node chain for a case study's architecture. Scrolls on narrow
 * viewports rather than wrapping, so the left-to-right reading stays intact.
 *
 * Connectors use flat colours, not a gradient: an SVG gradient defaults to
 * `objectBoundingBox` units, and the bounding box of a horizontal line is zero
 * pixels tall — a degenerate box paints nothing, which is why these edges were
 * invisible.
 */
function Connector() {
  return (
    <div aria-hidden className="flex flex-none items-center px-1">
      <svg width="56" height="14" viewBox="0 0 56 14" className="block">
        <line
          className="anim-flow"
          x1="2"
          y1="7"
          x2="44"
          y2="7"
          stroke="var(--brand-cyan)"
          strokeOpacity="0.75"
          strokeWidth="1.5"
          strokeDasharray="5 6"
          style={{ animationDuration: '5s' }}
        />
        <path
          d="M43 3 L50 7 L43 11"
          fill="none"
          stroke="var(--brand-violet)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/** Source → service → sink, tinted along the brand ramp so the row reads left to right. */
function nodeTone(index: number, total: number) {
  if (index === 0) return 'border-brand-cyan/35 bg-brand-cyan/8 hover:border-brand-cyan/80'
  if (index === total - 1)
    return 'border-brand-violet/35 bg-brand-violet/8 hover:border-brand-violet/80'
  return 'border-brand-blue/30 bg-brand-blue/8 hover:border-brand-cyan/70'
}

export function ArchitectureFlow({ nodes, label }: { nodes: ArchitectureNode[]; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${nodes.map((n) => `${n.name} (${n.sub})`).join(' → ')}`}
      className="relative"
    >
      <div className="flex items-stretch overflow-x-auto pb-2">
        {nodes.map((node, i) => (
          <div key={node.name} aria-hidden className="flex flex-none items-stretch">
            <div
              className={cn(
                'flex min-w-32 flex-none flex-col justify-center rounded-xl border px-4 py-3 transition-colors duration-300',
                nodeTone(i, nodes.length),
              )}
            >
              <div className="font-mono text-[0.78rem] text-foreground">{node.name}</div>
              <div className="mt-1 text-[0.66rem] leading-tight text-faint">{node.sub}</div>
            </div>

            {i < nodes.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      {/* Scroll affordance. Five nodes measure ~896px, which fits the card from
          the lg breakpoint up, so the hint is only needed below it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent lg:hidden"
      />
    </div>
  )
}
