<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Agent Instructions for my-portfolio

> Read `ai-docs/guideline.md` for the full project reference. This file covers the high-level rules every agent MUST follow.

## Identity

- **Project**: Portfolio site for Quach Hoang Anh
- **Domain**: `hayes.io.vn`
- **Stack**: Next.js 16.2.3 · React 19 · Tailwind CSS v4 · shadcn/ui v4 (base-ui) · next-intl 4.9 · Framer Motion · MDX

## Hard Rules — Violations Will Break the Build

### 1. Next.js 16

- **Proxy, not Middleware**: The routing interceptor is `proxy.ts` at project root. It exports a **named** `proxy` function. Do NOT create `middleware.ts`.
- **Async params**: Page and layout `params` is always `Promise<{...}>`. Await it: `const { slug } = await params`.
- **Server Components by default**: Only add `"use client"` when the component uses hooks (`useState`, `useEffect`, `useTranslations`, etc.), event handlers, or browser APIs.
- **Consult the docs**: When unsure about an API, read `node_modules/next/dist/docs/01-app/` first.

### 2. Tailwind CSS v4

- **No `tailwind.config.ts`**. Theme is in `app/globals.css` → `@theme inline {}`.
- **Prefer built-in utilities** over arbitrary values (`h-125` not `h-[500px]`).
- **Use `bg-size-[...]`**, not `[background-size:...]`.
- **Use `supports-backdrop-filter:`**, not `supports-[backdrop-filter]:`.
- Colors are oklch, hue 260 (blue).

### 3. shadcn/ui v4 (base-ui)

- **`render` prop** for polymorphic composition:
  ```tsx
  <Button nativeButton={false} render={<Link href="/" />}>
    Home
  </Button>
  ```
- **`nativeButton={false}`** is required when `render` outputs a non-`<button>` element (e.g. `<Link>` → `<a>`). Without it, Base UI logs a warning.
- **`asChild` does NOT exist** in this version. Using it will silently break rendering.
- Add new components via `npx shadcn add <name>`. Do NOT hand-write `components/ui/` files.

### 4. Internationalization (next-intl)

- **Two locales**: `en` (default, no prefix), `vi` (prefix `/vi`).
- **All user-facing strings** in section components must use `useTranslations()`. Never hardcode display text.
- **Translation files**: `messages/en.json`, `messages/vi.json`. Both MUST stay in sync — if you add a key to one, add it to the other.
- **Locale-aware links** in client components: Import `Link` from `@/i18n/navigation`, not `next/link`.

### 5. Brand Icons

`lucide-react` does NOT have GitHub/LinkedIn/Twitter icons. Import from:

```tsx
import { GithubIcon, LinkedinIcon, TwitterIcon } from '@/components/icons'
```

### 6. Content (Blog / Case Studies)

- Blog MDX: `content/blog/<slug>.mdx`
- Case study MDX: `content/case-studies/<slug>.mdx`
- Render with `<MDXRemote source={content} />` from `@/components/mdx-remote`.
- Content is read server-side via `lib/content.ts`. Never import this in client components.

### 7. Data Layer

- Static data lives in `data/*.ts` (profile, skills, experiences, projects, certifications, social-links, navigation).
- Type definitions in `types/index.ts` and `types/content.ts`.
- Site-wide config (URL, OG image, description) in `lib/site-config.ts`.

## Quick Reference

| Task                 | Command / Location                                  |
| -------------------- | --------------------------------------------------- |
| Dev server           | `npm run dev`                                       |
| Build                | `npm run build`                                     |
| Add shadcn component | `npx shadcn add <name>`                             |
| Add blog post        | Create `content/blog/<slug>.mdx`                    |
| Add case study       | Create `content/case-studies/<slug>.mdx`            |
| Add translation key  | Edit both `messages/en.json` AND `messages/vi.json` |
| Change site URL/meta | Edit `lib/site-config.ts`                           |
| Next.js 16 docs      | `node_modules/next/dist/docs/`                      |
