# CLAUDE.md — Project Context for Claude/Copilot

> This file is loaded automatically. For the full reference, see `ai-docs/guideline.md`.

## What This Project Is

Personal portfolio for **Quach Hoang Anh** at `hayes.io.vn`. A single page: an interactive 3D Da Nang rendered with procedural, city-builder realism, bilingual (EN / JA). The city is procedural; vehicles near the camera are glTF models (see below).

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

- The first paint is the server-rendered welcome screen. **Nothing 3D loads until the visitor interacts** (`START_EVENTS` in `components/world/world-experience.tsx`: pointer move/down, key, wheel, touch — or the "Enter" button); then the canvas chunk, the HUD, the panels and the model packs load. This keeps the first load to the framework plus the welcome screen (Lighthouse: desktop 100 ×4, mobile 97/100/100/100) and crawlers never run WebGL.
- **Never import three.js (or anything that does: `lib/world/daylight.ts`, `geo.ts`, `layout.ts`, `drive.ts`, `materials.ts`) from the welcome screen's module graph** (`world-experience.tsx`, `ui/overlays.tsx`, `lib/world/store.ts`, `lib/world/clock.ts`…) — it drags ~100 KB of three into the first load. Clock helpers live in three-free `lib/world/clock.ts` for exactly this reason.
- No `NextIntlClientProvider`: client components get strings as props and nothing on the client uses next-intl hooks (the locale toggle is a plain link via `getPathname`). Adding one back ships the client i18n runtime on every page.
- Vercel Analytics / Speed Insights render only when `VERCEL=1` (they 404 elsewhere and fail Lighthouse's console audit). To audit locally, build with `NEXT_PUBLIC_SITE_URL=http://localhost:<port>` so the canonical matches the audited URL.
- Post-processing (`components/world/scene/post-fx.tsx`, ~175 KB gzip) is a lazy chunk: high tier only, mounted after the scene is live. Keep it off the critical path.
- One font family: Be Vietnam Pro (400/500/700, latin only — add `vietnamese` back in `app/fonts.ts` if Vietnamese copy appears) via `next/font`, for all text; mono labels use system fonts. Don't add fonts or UI libraries casually — measure the page weight first.
- No GSAP: the intro flight is a frame-loop tween in the camera rig and the title card animates with CSS (`.world-rise`).

## 3D World — the homepage

- Route: `app/[locale]/page.tsx` resolves all strings server-side and passes them to `components/world/world-experience.tsx` (client). Panel bodies are Server Components in `components/world/panels/`, also rendered into an `sr-only` text version that carries the page's only `<h1>` (for screen readers and crawlers).
- Link to a section from other pages with `/?at=<section>` (`about`, `skills`, `projects`, `experience`, `contact`) — it opens that landmark directly. There are no `#anchors` on the homepage any more; `/world` redirects to `/`.
- **Landmark positions, camera shots and hit boxes** live in `lib/world/landmarks.ts`. Geography (river, coastlines, hills) in `lib/world/geo.ts`; procedural placement in `lib/world/layout.ts`.
- **Only `components/world/camera-rig.tsx` moves the camera.** Everything else bumps `command` in the Zustand store (`lib/world/store.ts`).
- **Ride mode** (driving a car): physics and collisions in `lib/world/drive.ts` (plain mutable `car` / `rideInput`, no React state), stepped by `components/world/scene/player-car.tsx` (mounted before the rig); the rig's `ride` command runs the chase camera. HUD in `components/world/ui/ride-hud.tsx`; the mini-map is `components/world/ui/minimap.tsx`. Both import geography (and so three.js) and must stay `lazy()` chunks.
- **Dragon fire show** follows the real schedule (Sat & Sun 21:00–21:15, Da Nang time) via `lib/world/fire-show.ts`; `?fireshow=1` previews it.
- Landmark interactivity is centralised in `components/world/landmark.tsx`; models never handle pointer events themselves.
- Per-frame animation goes through `useFrame` + refs or the shared `timeUniform` — never React state.
- GLSL: `smoothstep` edges must be ascending (`1.0 - smoothstep(a, b, x)` for a falloff); reversed edges render nothing on ANGLE/SwiftShader.
- `components/world/world.css` stays inside `@layer components` so Tailwind utilities can override it.
- Rendering tiers (`lib/world/quality.ts`): `high` adds the post-processing pass (`components/world/scene/post-fx.tsx`: N8AO, bloom, ACES tone mapping, vignette, SMAA — no tilt-shift, the frame stays sharp); `low` skips it. `?quality=high|low` pins a tier for comparison.
- **Never set `scene.environment` on the main scene** — since three r163 it also lights Lambert materials and washes the whole city out. The studio env renders into `studioEnvironment`; metals copy it into their own `envMap`.
- **Open world, not a platter**: land polygons reach `FAR` (520) in `lib/world/geo.ts`; distant hills come from `farTerrainHeight()` and a height-field sitting 0.35 under the land slab. City coordinates and landmark positions are unchanged from the original layout — extend outward, don't move the core.
- **glTF model packs**: `pnpm models` (`scripts/build-models.mjs`) bakes the CC0 sources in `assets/models/` (see its README) into `public/models/{vehicles,buildings,boats}.glb` — one mesh per model plus a simplified `<name>_lod1`, meshopt-compressed. Vehicles and boats are in world units facing +X; buildings are in kit units and fitted to each lot at runtime (`components/world/scene/kit-placement.ts`, which splits long tube-house lots into rows). `components/world/scene/models.ts` loads them (dynamic import of `model-loader.ts`, so GLTFLoader stays out of the scene chunk) and `ReadySignal` holds the loading screen until this tier's packs are in (`packsFor`, max `MODEL_WAIT_MS`). All traffic (cars only — no motorbikes), the player's car and boats are models only — there is no procedural fallback; buildings are kit models on the high tier and the procedural shader blocks on the low tier. Kit windows light up at night by atlas UV (`createKitMaterial` in `lib/world/materials.ts`).
- **Art direction is realistic** (palette in `lib/world/palette.ts`): concrete/glass/asphalt, Da Nang tube houses (`nhà ống`) with rooftop water tanks, car traffic, physical `Sky` + exponential haze, ACES. Facades, roads and fields are shader-drawn from world/UV coordinates.
- Things that emit light use `glowColor()` (HDR, > 1.0) so bloom selects them; sunlit surfaces peak ≈ 1.4 and the bloom threshold is 1.5. N8AO's `gammaCorrection` must stay `false` (it's mid-chain).
