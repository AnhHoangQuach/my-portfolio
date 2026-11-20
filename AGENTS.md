<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Agent Instructions for my-portfolio

> `CLAUDE.md` has the project overview; `ai-docs/guideline.md` the full reference. These are the rules that break the build or the site if ignored.

## Identity

- **Project**: Portfolio of Quach Hoang Anh (Hayes) at `hayes.io.vn`
- **What it is**: a single page — an interactive 3D Da Nang with procedural city-builder realism — in English (`/`) and Japanese (`/ja`)
- **Stack**: Next.js 16.4.6 · React 19.3 · three.js + React Three Fiber + drei · postprocessing + n8ao · Zustand · Tailwind CSS v4 · next-intl 4.15
- **Toolchain**: Node 26 (`.nvmrc`) · pnpm 12 (`packageManager` in package.json)

## Hard Rules

### 1. Next.js 16

- **Proxy, not Middleware**: `proxy.ts` exports a **named** `proxy`. Do not create `middleware.ts`.
- **Async params**: `params` is a `Promise` — `const { locale } = await params`.
- **Stay static**: the homepage prerenders. Don't read headers/cookies/`searchParams` on the server; per-visit state (e.g. `?at=`) is read on the client.

### 2. Tailwind CSS v4

- No `tailwind.config.ts`. `app/globals.css` only wires up fonts; world UI tokens (`--w-*`) live in `components/world/world.css` inside `@layer components`.

### 3. Internationalization (next-intl)

- Two locales: `en` (no prefix) and `ja` (`/ja`). `messages/en.json` and `messages/ja.json` **must** have identical keys.
- Client Components never call `useTranslations()`: the page resolves every string on the server and passes it down as props (`WorldStrings`). The catalogue never ships to the browser.

### 4. The 3D world

- Only `components/world/camera-rig.tsx` moves the camera; everything else bumps `command` in `lib/world/store.ts`. Never disable camera input during a flight — the visitor must always be able to take over.
- Mutate three.js objects inside `useFrame` through refs (mesh refs, or lazily created refs) — never through `useMemo`/state values. The React Compiler lint rejects the latter.
- GLSL: `smoothstep` edges must ascend, and no shader may divide by something that can reach 0. Post-processing runs in half-float buffers, where one `Inf` pixel blanks the frame.
- Never set `scene.environment` on the main scene (it lights Lambert materials too).
- **Create and dispose GPU resources in the same effect** (create in `useEffect`, dispose in its cleanup). `useMemo` + dispose-in-cleanup breaks under React Strict Mode in `pnpm dev`: the instant cleanup disposes what the memo still hands out. It froze the whole canvas once (PostFX).
- Verify 3D changes by comparing real canvas pixels, in `pnpm dev` **and** a production build, on **both** quality tiers (`?quality=high|low`). DOM overlays (markers, panels) keep working even when the canvas is frozen.

### 5. Brand icons

`lucide-react` has no GitHub/LinkedIn icons — use `GithubIcon`/`LinkedinIcon` from `@/components/icons`.

### 6. Dependencies

- Fix `pnpm audit` findings by upgrading the direct package or `pnpm update <transitive>` within ranges. Do **not** use `pnpm audit --fix` or `overrides`.
- New packages with install scripts must be approved in `pnpm-workspace.yaml` (`allowBuilds`).

## Quick Reference

| Task                     | Command / Location                                       |
| ------------------------ | -------------------------------------------------------- |
| Dev server               | `pnpm dev`                                               |
| Build                    | `pnpm build`                                             |
| Lint                     | `pnpm lint`                                              |
| Move a landmark / camera | `lib/world/landmarks.ts`                                 |
| Edit section content     | `components/world/panels/index.tsx`, `data/*.ts`         |
| Add a translation key    | Both `messages/en.json` **and** `messages/ja.json`       |
| Site URL / metadata      | `lib/site-config.ts`, `lib/metadata.ts`                  |
