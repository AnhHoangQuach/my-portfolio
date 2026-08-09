import { ImageResponse } from 'next/og'

import { siteConfig } from './site-config'
import { profile } from '@/data/profile'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * Shared Open Graph card for blog posts and project pages.
 *
 * Rendered through Satori, which supports only a flexbox subset of CSS — no
 * Tailwind classes, no `gap` shorthand quirks, no CSS variables. The brand
 * ramp is therefore spelled out as literal hex, kept in sync by eye with
 * `--brand-cyan/blue/violet` in globals.css.
 */
export function renderOgImage({
  eyebrow,
  title,
  tags,
}: {
  eyebrow: string
  title: string
  tags?: string[]
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#05070d',
          backgroundImage:
            'radial-gradient(1000px 500px at 15% -10%, rgba(43,86,255,0.30), transparent), radial-gradient(800px 400px at 95% 110%, rgba(139,92,246,0.25), transparent)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent rule, echoing the cyan → blue → violet ramp used sitewide. */}
        <div
          style={{
            display: 'flex',
            height: 6,
            width: 180,
            borderRadius: 999,
            backgroundImage: 'linear-gradient(90deg, #22d3ee, #2b56ff 55%, #8b5cf6)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#22d3ee',
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: title.length > 60 ? 62 : 76,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -2,
              color: '#f8fafc',
              // Satori has no line clamping; the length-based size step above
              // is what keeps a long headline inside the card.
              display: 'flex',
            }}
          >
            {title}
          </div>

          {tags && tags.length > 0 && (
            <div style={{ marginTop: 28, display: 'flex' }}>
              {tags.slice(0, 5).map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    marginRight: 12,
                    padding: '8px 18px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.28)',
                    fontSize: 22,
                    color: '#cbd5e1',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 26,
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex' }}>
            {profile.name} ({siteConfig.alternateName}) · {profile.role}
          </div>
          <div style={{ display: 'flex', color: '#64748b' }}>{siteConfig.domain}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
