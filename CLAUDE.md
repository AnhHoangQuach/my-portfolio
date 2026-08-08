# CLAUDE.md — Project Context for Claude/Copilot

> This file is loaded automatically. For the full reference, see `ai-docs/guideline.md`.

## What This Project Is

Personal portfolio for **Quach Hoang Anh** at `hayes.io.vn`. One-page design with a blog and case study system, bilingual (EN/VI).

## Stack At A Glance

Next.js **16.3.0** · React **19** · Tailwind CSS **v4** · shadcn/ui **v4** (base-ui) · next-intl · MDX

## Things That WILL Trip You Up

1. **`proxy.ts`** not `middleware.ts` — Next.js 16 renamed it. Named export `proxy`, not default.
2. **`params` is a Promise** — always `await params` in pages/layouts.
3. **`render` prop** not `asChild` — shadcn/ui v4 is base-ui, not Radix.
4. **No `tailwind.config.ts`** — theme lives in `app/globals.css` `@theme inline {}`.
5. **Brand icons** — `GithubIcon`, `LinkedinIcon` come from `@/components/icons`, not `lucide-react`.
6. **i18n** — section headings/labels use `useTranslations()`; CV-record content (role bullets, case-study prose) lives in `data/*.ts` in English. Both `messages/en.json` and `messages/ja.json` must be kept in sync.
   6b. **Design tokens** — the `cyan → blue → violet` ramp is `--brand-cyan/blue/violet`; use the `bg-brand-ramp` / `bg-brand-line` / `bg-panel-gradient` classes and the `text-dim`, `text-faint`, `border-hairline` tiers rather than re-deriving colors.
7. **Content** — blog and case study MDX files in `content/`. Read via `lib/content.ts` (server-only).
8. **Locale links** — in client components, use `Link` from `@/i18n/navigation`, not `next/link`.

## Commands

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Key Files

| What                               | Where                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| Site config (URL, OG, description) | `lib/site-config.ts`                                   |
| Translations                       | `messages/en.json`, `messages/ja.json`                 |
| Static data                        | `data/*.ts`                                            |
| Types                              | `types/index.ts`, `types/content.ts`                   |
| Content reader                     | `lib/content.ts`                                       |
| i18n config                        | `i18n/config.ts`, `i18n/routing.ts`, `i18n/request.ts` |
| MDX components                     | `mdx-components.tsx`                                   |
| Theme tokens                       | `app/globals.css`                                      |

## Before Writing Code

- Read `ai-docs/guideline.md` for full conventions, directory map, and gotchas.
- Read `AGENTS.md` for hard rules that prevent build failures.
- When unsure about a Next.js 16 API, check `node_modules/next/dist/docs/01-app/`.

## Performance Rules

- **Never wrap above-the-fold content in `<Reveal>`.** It ships at `opacity: 0` and only lifts after hydration, which makes it a terrible LCP candidate. The hero opts out deliberately.
- **Client Components get strings as props**, not `useTranslations()` — see `components/layout/site-header.tsx`. `NextIntlClientProvider` is mounted for `locale` only (the client `Link` needs it) and is passed **no** `messages`, so the catalogue never ships to the browser.
- Sections are Server Components. Only `navbar`, `mobile-menu`, `terminal-card`, `reveal`, `theme-toggle` and `locale-switcher` are client.
