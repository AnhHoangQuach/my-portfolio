'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/components/use-reduced-motion'
import { terminalScript } from '@/data/hero'
import { TerminalLine } from '@/types'

/** Milliseconds per typed character. Prompt lines type slightly slower. */
const CHAR_MS = 26
/** Pause after a finished line, and before the transcript loops. */
const LINE_PAUSE_MS = { prompt: 260, output: 520 }
const LOOP_PAUSE_MS = 4200

const toneClass: Record<TerminalLine['tone'], string> = {
  command: 'text-foreground',
  output: 'text-faint',
  accent: 'text-brand-cyan',
  violet: 'text-brand-violet',
}

export function TerminalCard({ title }: { title: string }) {
  const reduceMotion = useReducedMotion()
  const [cursor, setCursor] = useState({ line: 0, char: 0 })

  useEffect(() => {
    if (reduceMotion) return

    const { line, char } = cursor

    if (line >= terminalScript.length) {
      const id = setTimeout(() => setCursor({ line: 0, char: 0 }), LOOP_PAUSE_MS)
      return () => clearTimeout(id)
    }

    const current = terminalScript[line]

    if (char >= current.text.length) {
      const pause = current.prompt ? LINE_PAUSE_MS.prompt : LINE_PAUSE_MS.output
      const id = setTimeout(() => setCursor({ line: line + 1, char: 0 }), pause)
      return () => clearTimeout(id)
    }

    const id = setTimeout(
      () => setCursor({ line, char: char + 1 }),
      CHAR_MS + (current.prompt ? 22 : 0),
    )
    return () => clearTimeout(id)
  }, [cursor, reduceMotion])

  // With motion reduced the whole transcript is shown at once.
  const lastVisible = reduceMotion ? terminalScript.length - 1 : cursor.line
  const visible = terminalScript.slice(0, Math.min(lastVisible + 1, terminalScript.length))

  return (
    <div className="bg-panel-gradient overflow-hidden rounded-2xl border border-hairline shadow-panel">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2.5 font-mono text-[0.72rem] text-faint">{title}</span>
      </div>

      {/* role="img" + label: a plain <div> may not carry aria-label, and the
          per-character reveal is noise to a screen reader anyway. */}
      <div
        role="img"
        aria-label={terminalScript.map((l) => l.prompt + l.text).join('. ')}
        className="min-h-67 px-5 pt-5 pb-6 font-mono text-[0.81rem] leading-[1.85]"
      >
        {visible.map((line, i) => {
          const isTyping = !reduceMotion && i === cursor.line
          const text = isTyping ? line.text.slice(0, cursor.char) : line.text
          return (
            <div key={i} aria-hidden className="break-words whitespace-pre-wrap">
              <span className="text-brand-cyan">{line.prompt}</span>
              <span className={toneClass[line.tone]}>{text}</span>
              {isTyping && <span className="anim-blink text-brand-cyan">▍</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
