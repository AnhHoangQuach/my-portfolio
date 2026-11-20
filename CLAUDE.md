# CLAUDE.md — Project Context for Claude/Copilot

> This file is loaded automatically. For the full reference, see `ai-docs/guideline.md`.

## What This Project Is

Personal portfolio for **Quach Hoang Anh** at `hayes.io.vn`. A single page: an interactive 3D Da Nang rendered with procedural, city-builder realism (no downloaded models or textures), bilingual (EN / JA).

## Stack At A Glance

Next.js **16.4.6** · React **19.3** · three.js + React Three Fiber + drei · postprocessing + n8ao · Zustand · Tailwind CSS **v4** · next-intl. Node 26 (`.nvmrc`), pnpm 12.

## Things That WILL Trip You Up

1. **`proxy.ts`** not `middleware.ts` — Next.js 16 renamed it. Named export `proxy`, not default.
2. **`params` is a Promise** — always `await params` in pages/layouts.
3. **No `tailwind.config.ts`** — `app/globals.css` only sets fonts; world UI tokens are in `components/world/world.css`.
4. **Brand icons** — `GithubIcon`, `LinkedinIcon` come from `@/components/icons`, not `lucide-react`.
5. **i18n** — strings are resolved in `app/[locale]/page.tsx` and passed to client components as props; CV content lives in `data/*.ts` in English. Keep `messages/en.json` and `messages/ja.json` in sync.
6. **Dependencies** — never `pnpm audit --fix` / `overrides`; upgrade the direct package or `pnpm update <pkg>` within ranges.

## Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Key Files

| What                               | Where                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| The page                           | `app/[locale]/page.tsx`                                |
| Site config (URL, OG, description) | `lib/site-config.ts`                                   |
| Translations                       | `messages/en.json`, `messages/ja.json`                 |
| CV data                            | `data/*.ts`                                            |
| Landmarks, camera shots            | `lib/world/landmarks.ts`                               |
| i18n config                        | `i18n/config.ts`, `i18n/routing.ts`, `i18n/request.ts` |

## Before Writing Code

- Read `AGENTS.md` for the hard rules and `ai-docs/guideline.md` for the full reference.
- When unsure about a Next.js 16 API, check `node_modules/next/dist/docs/01-app/`.

## Performance Rules

- The first paint is the server-rendered loading screen; three.js and the scene are a separate chunk whose download starts as soon as the client module evaluates (`components/world/world-experience.tsx`).
- Post-processing (`components/world/scene/post-fx.tsx`, ~175 KB gzip) is a lazy chunk: high tier only, mounted after the scene is live. Keep it off the critical path.
- One font family: Be Vietnam Pro (400/500/700, latin + vietnamese) via `next/font`, for all text; mono labels use system fonts. Don't add fonts or UI libraries casually — measure the page weight first.
- No GSAP: the intro flight is a frame-loop tween in the camera rig and the title card animates with CSS (`.world-rise`).

## 3D World — the homepage

- Route: `app/[locale]/page.tsx` resolves all strings server-side and passes them to `components/world/world-experience.tsx` (client). Panel bodies are Server Components in `components/world/panels/`, also rendered into an `sr-only` text version that carries the page's only `<h1>` (for screen readers and crawlers).
- Link to a section from other pages with `/?at=<section>` (`about`, `skills`, `projects`, `experience`, `contact`) — it opens that landmark directly. There are no `#anchors` on the homepage any more; `/world` redirects to `/`.
- **Landmark positions, camera shots and hit boxes** live in `lib/world/landmarks.ts`. Geography (river, coastlines, hills) in `lib/world/geo.ts`; procedural placement in `lib/world/layout.ts`.
- **Only `components/world/camera-rig.tsx` moves the camera.** Everything else bumps `command` in the Zustand store (`lib/world/store.ts`).
- Landmark interactivity is centralised in `components/world/landmark.tsx`; models never handle pointer events themselves.
- Per-frame animation goes through `useFrame` + refs or the shared `timeUniform` — never React state.
- GLSL: `smoothstep` edges must be ascending (`1.0 - smoothstep(a, b, x)` for a falloff); reversed edges render nothing on ANGLE/SwiftShader.
- `components/world/world.css` stays inside `@layer components` so Tailwind utilities can override it.
- Rendering tiers (`lib/world/quality.ts`): `high` adds the post-processing pass (`components/world/scene/post-fx.tsx`: N8AO, bloom, ACES tone mapping, vignette, SMAA — no tilt-shift, the frame stays sharp); `low` skips it. `?quality=high|low` pins a tier for comparison.
- **Never set `scene.environment` on the main scene** — since three r163 it also lights Lambert materials and washes the whole city out. The studio env renders into `studioEnvironment`; metals copy it into their own `envMap`.
- **Open world, not a platter**: land polygons reach `FAR` (520) in `lib/world/geo.ts`; distant hills come from `farTerrainHeight()` and a height-field sitting 0.35 under the land slab. City coordinates and landmark positions are unchanged from the original layout — extend outward, don't move the core.
- **Art direction is realistic** (palette in `lib/world/palette.ts`): concrete/glass/asphalt, Da Nang tube houses (`nhà ống`) with rooftop water tanks, motorbike-heavy traffic, physical `Sky` + exponential haze, ACES. Facades, roads and fields are shader-drawn from world/UV coordinates.
- Things that emit light use `glowColor()` (HDR, > 1.0) so bloom selects them; sunlit surfaces peak ≈ 1.4 and the bloom threshold is 1.5. N8AO's `gammaCorrection` must stay `false` (it's mid-chain).
