/**
 * Fixed, non-interactive gradient field behind the whole page. Pure CSS — it
 * replaces the three.js canvases the previous design used in the hero.
 *
 * The blobs are dialled well down in light mode: at dark-mode strength they
 * read as ink spills on a near-white page rather than ambient light.
 */
export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="anim-drift absolute -top-[18%] -left-[10%] h-[52vw] w-[52vw] rounded-full bg-brand-blue/8 blur-[30px] dark:bg-brand-blue/25" />
      <div
        className="anim-drift absolute top-[24%] -right-[14%] h-[46vw] w-[46vw] rounded-full bg-brand-violet/6 blur-2xl dark:bg-brand-violet/18"
        style={{ animationDirection: 'reverse', animationDuration: '24s' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,var(--brand-cyan),transparent_60%)] opacity-4 dark:opacity-10" />
    </div>
  )
}
