# Portfolio Project — AI Agent Guideline

> Full reference for agents working on this repo. `AGENTS.md` lists the hard rules; `CLAUDE.md` the overview.

## 1. Project Identity

| Field    | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Owner    | Quach Hoang Anh (Hayes), Senior Software Engineer, Da Nang         |
| Domain   | `hayes.io.vn`                                                      |
| Product  | One page: "Da Nang DevQuest", an interactive 3D miniature of the city |
| Locales  | `en` at `/`, `ja` at `/ja`                                         |
| Hosting  | Vercel (Node 26)                                                   |

Each portfolio section is a landmark in the world:

| Landmark          | Section    | Model code                         |
| ----------------- | ---------- | ---------------------------------- |
| Dragon Bridge     | Home       | `scene/dragon-bridge.tsx`, `scene/dragon-fire.tsx` |
| City Center       | About Me   | `scene/city.tsx`                   |
| Son Tra Peninsula | Skills     | `scene/mountains.tsx`              |
| My Khe Beach      | Projects   | `scene/beach.tsx`                  |
| Marble Mountains  | Experience | `scene/mountains.tsx`              |
| Love Bridge       | Contact    | `scene/bridges.tsx`                |

## 2. Tech Stack

| Layer      | Package                                   | Version | Notes                                                   |
| ---------- | ----------------------------------------- | ------- | ------------------------------------------------------- |
| Framework  | `next`                                    | 16.4.6  | App Router, Turbopack, `proxy.ts` replaces middleware   |
| UI         | `react` / `react-dom`                     | 19.3.1  | React Compiler lint rules are on (`eslint-config-next`) |
| 3D         | `three`, `@react-three/fiber`, `@react-three/drei` | 0.187 / 9.8 / 10.7 | drei: `CameraControls`, `Html`, `Outlines`, `PerformanceMonitor` only |
| Post FX    | `postprocessing`, `n8ao`                  | 6.39 / 2.1 | Used directly (no React wrapper); lazy chunk       |
| State      | `zustand`                                 | 5       | `lib/world/store.ts`                                    |
| Styling    | `tailwindcss`                             | v4      | No config file                                          |
| i18n       | `next-intl`                               | 4.15    | Strings resolved server-side, passed as props           |
| Icons      | `lucide-react`                            | 1.x     | Brand icons in `components/icons.tsx`                   |
| Toolchain  | Node 26 (`.nvmrc`), pnpm 12               |         | Install scripts allow-listed in `pnpm-workspace.yaml`   |

## 3. Architecture

### 3.1 Request → page

- `app/layout.tsx` is a pass-through; the document shell is `app/[locale]/layout.tsx` (locale from the route param, so every page prerenders).
- `app/[locale]/page.tsx` resolves all strings into a `WorldStrings` object, renders the panel bodies (Server Components in `components/world/panels/`) and hands both to `components/world/world-experience.tsx`.
- The same panels are also rendered into `<main id="world-text" class="sr-only">`: the page's only `<h1>` and the full content as text, for screen readers, crawlers and the no-WebGL text mode.

### 3.2 Client shell

- `world-experience.tsx` mounts the HUD, info panel, intro overlay and loading screen, and loads `world-canvas.tsx` with `next/dynamic` (`ssr: false`). The import starts at module evaluation, before hydration.
- No WebGL → a fallback card whose button sets `html[data-text-mode]`, which hides the map and shows `#world-text` (styles in `world.css`).
- `?at=<section>` deep-links straight to a landmark (read on the client; the page stays static). `/world` and every retired blog/case-study URL redirect permanently (`next.config.ts`).

### 3.3 Scene

- `lib/world/geo.ts` — river, coastlines, hills, helpers. `lib/world/layout.ts` — deterministic procedural placement (roads, buildings, trees). `lib/world/landmarks.ts` — landmark positions, camera shots, hit boxes, intro path.
- `components/world/landmark.tsx` owns all interactivity: one invisible hit box per landmark; models are never raycast.
- `components/world/camera-rig.tsx` is the only camera writer. Commands arrive via `store.command`; the intro flight is a frame-loop tween.
- Per-frame work happens in `useFrame` through refs or the shared `timeUniform` — never React state.

### 3.4 Rendering & quality tiers

- `lib/world/quality.ts`: `high` (desktop) adds `scene/post-fx.tsx` — N8AO, bloom, tilt-shift, neutral tone mapping, vignette, SMAA — loaded lazily after the scene is live. `low` (phones, ≤4 cores/GB) skips it and uses a 1024 shadow map. `PerformanceMonitor` downgrades on sustained low FPS. `?quality=high|low` pins a tier.
- Light emitters use `glowColor()` (HDR > 1.0) so bloom selects them; bloom threshold 1.5.
- Metals take their reflections from `scene/environment.tsx` (`studioEnvironment`), never from `scene.environment`.

## 4. Gotchas

- **Inf/NaN in shaders blank the frame** on the high tier: half-float buffers keep `Inf`, bloom spreads it, tone mapping makes it NaN. Bound every division (drei's `Sparkles` had `0.05 / d` — replaced by `scene/sparkles.tsx`).
- **`smoothstep(a, b, x)` needs `a < b`** — reversed edges are undefined and render nothing on ANGLE/SwiftShader.
- **N8AO `gammaCorrection` must be `false`** — mid-chain it double-encodes sRGB.
- **CanvasTexture flips Y** by default; set `flipY = false` for world-space masks.
- **Never lock camera input during scripted flights.** The damped flights take ~5 s to "rest"; locking input until then swallowed zoom after every click. The visitor's first drag/scroll/pinch takes over (`takeOver` in `camera-rig.tsx`); only landmark *clicks* are guarded, for 1.2 s.
- **Zoom goes to the orbit target** (`dollyToCursor = false`). Zooming to the cursor slid the view sideways and flung markers around; markers are also hidden while a panel is open.
- **Strict Mode (dev) double-mounts effects.** Anything disposed in an effect cleanup must also be created in that effect. `PostFX` once built its composer in `useMemo` and disposed it in a cleanup; in `pnpm dev` that emptied the composer, and because it owns rendering the canvas froze (no intro, no zoom, no clicks). Test dev and production, both tiers, on canvas pixels.
- **React Compiler lint**: don't mutate `useMemo`/state values or read refs during render; mutate three.js objects in `useFrame` via refs.
- **`world.css` stays in `@layer components`**, so Tailwind utilities (`hidden`, `lg:flex`) can override it. Text-mode rules are intentionally unlayered.

## 5. Common Tasks

- **Move a landmark or reframe its shot**: edit `LANDMARKS` in `lib/world/landmarks.ts`.
- **Change section content**: `components/world/panels/index.tsx` (layout + labels) and `data/*.ts` (CV content).
- **Add a UI string**: add the key to both `messages/en.json` and `messages/ja.json`, map it in `app/[locale]/page.tsx`, extend `WorldStrings`.
- **Check page weight**: `pnpm build && pnpm start`, then measure transfer per resource type before and after. Keep three.js the only large chunk on the critical path.

## 6. Commands

```bash
pnpm dev     # Dev server (Turbopack)
pnpm build   # Production build
pnpm start   # Serve the production build
pnpm lint    # ESLint (includes React Compiler rules)
```

## 7. Environment Variables

| Variable                               | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Canonical origin (defaults to `https://hayes.io.vn`) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console token; omitted when unset    |
