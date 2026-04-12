# Portfolio Project — AI Agent Guideline

> **Owner**: Quach Hoang Anh — hayes.io.vn
> **Last updated**: 2026-04-13

---

## 1. Project Identity

| Field        | Value                                                 |
| ------------ | ----------------------------------------------------- |
| **Name**     | my-portfolio                                          |
| **Domain**   | `hayes.io.vn`                                         |
| **Purpose**  | Personal developer portfolio with blog & case studies |
| **Language** | TypeScript (strict mode)                              |
| **Node**     | ≥ 18                                                  |

---

## 2. Tech Stack — Exact Versions Matter

| Layer      | Technology                          | Version    | Notes                                                                               |
| ---------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Framework  | **Next.js**                         | **16.2.3** | App Router, Turbopack, `proxy.ts` replaces `middleware.ts`                          |
| React      | **React**                           | **19.2.4** | Server Components by default                                                        |
| Styling    | **Tailwind CSS**                    | **v4**     | CSS-first config (`@theme inline {}` in `globals.css`). No `tailwind.config.ts`.    |
| Components | **shadcn/ui**                       | **v4**     | Built on `@base-ui/react` (NOT Radix). Uses `render` prop, NOT `asChild`.           |
| i18n       | **next-intl**                       | **4.9.1**  | `localePrefix: "as-needed"`, locales: `en`, `vi`                                    |
| Content    | **@next/mdx** + **next-mdx-remote** | latest     | MDX for blog & case studies, parsed with `gray-matter` + `reading-time`             |
| Animation  | **Framer Motion**                   | 12.x       | Via `FadeIn`, `FadeInStagger`, `FadeInStaggerItem` wrappers                         |
| Theme      | **next-themes**                     | 0.4.x      | Dark (default) / Light / System                                                     |
| Icons      | **lucide-react**                    | 1.8.x      | Brand icons (GitHub, LinkedIn, Twitter/X) are custom SVGs in `components/icons.tsx` |
| Analytics  | **@vercel/analytics**               | 2.x        | Loaded in `app/[locale]/layout.tsx`                                                 |
| SEO        | Metadata API + JSON-LD              | —          | `lib/site-config.ts` centralizes URL/OG/description                                 |

---

## 3. Critical Conventions — Read Before Writing Code

### 3.1 Next.js 16 Breaking Changes

1. **`proxy.ts` replaces `middleware.ts`** — the file at project root exports a **named** `proxy` function (not default). See `proxy.ts`.
2. **`params` is a Promise** — in page/layout components, always `const { slug } = await params`.
3. **Server Components are the default** — only add `"use client"` when you need hooks, event handlers, or browser APIs.
4. **Read the docs**: `node_modules/next/dist/docs/` contains the authoritative reference for this Next.js version.

### 3.2 Tailwind CSS v4

- **No `tailwind.config.ts`** — all theming is done in `app/globals.css` via `@theme inline {}`.
- Colors use **oklch** values with a blue-tinted palette (hue 260).
- Prefer **built-in utilities** over arbitrary values: `h-125` not `h-[500px]`, `translate-y-10` not `translate-y-[2.5rem]`.
- Use `bg-size-[...]` instead of `[background-size:...]`.
- Use `supports-backdrop-filter:` instead of `supports-[backdrop-filter]:`.

### 3.3 shadcn/ui v4 (base-ui)

- **`render` prop for composition**, NOT `asChild`:

  ```tsx
  // ✅ Correct — nativeButton={false} required when render outputs a non-<button>
  <Button nativeButton={false} render={<Link href="/about" />}>About</Button>

  // ❌ Wrong (Radix pattern — does NOT work)
  <Button asChild><Link href="/about">About</Link></Button>
  ```

- UI components live in `components/ui/`. Do not manually edit them — use `npx shadcn add <component>`.

### 3.4 Internationalization (next-intl)

- **Routing**: `localePrefix: "as-needed"` — English at `/`, Vietnamese at `/vi/...`.
- **App structure**: Pages live under `app/[locale]/`. The root `app/layout.tsx` is a thin shell (fonts + body); the locale layout (`app/[locale]/layout.tsx`) provides `NextIntlClientProvider`, `ThemeProvider`, metadata, and analytics.
- **Translations**: `messages/en.json` and `messages/vi.json`. Keyed by section: `nav`, `hero`, `about`, `skills`, `experience`, `projects`, `certifications`, `contact`, `footer`, `blog`, `caseStudy`.
- **Usage in components**: All `"use client"` section components import `useTranslations` from `next-intl`:
  ```tsx
  const t = useTranslations('hero')
  return <p>{t('viewProjects')}</p>
  ```
- **Navigation helpers**: Import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` (NOT from `next/link`) when you need locale-aware routing in client components. Server components can use regular `next/link`.
- **Adding a new locale**: (1) Add to `i18n/config.ts` locales array, (2) create `messages/<locale>.json`, (3) update `alternates.languages` in locale layout metadata.

### 3.5 Content System (Blog & Case Studies)

- **Blog posts**: MDX files in `content/blog/<slug>.mdx`
- **Case studies**: MDX files in `content/case-studies/<slug>.mdx`
- **Frontmatter** (blog):
  ```yaml
  title: 'Post Title'
  description: 'Short description'
  date: '2024-12-15'
  tags: ['Next.js', 'React']
  published: true
  image: '/images/blog/cover.svg' # optional
  ```
- **Frontmatter** (case study):
  ```yaml
  title: 'Project Name'
  subtitle: 'One-liner'
  description: 'Longer description'
  date: '2024-09-15'
  techStack: ['Next.js', 'TypeScript', 'PostgreSQL']
  published: true
  image: '/images/project.svg' # optional
  liveUrl: 'https://example.com' # optional
  githubUrl: 'https://github.com/…' # optional
  ```
- **Content reading**: `lib/content.ts` exports `getBlogPosts()`, `getBlogPost(slug)`, `getCaseStudies()`, `getCaseStudy(slug)`. All server-side only (uses `fs`).
- **MDX rendering**: `components/mdx-remote.tsx` wraps `next-mdx-remote/rsc` with custom components from `mdx-components.tsx`.
- **Static generation**: Blog and case study detail pages use `generateStaticParams()`.

### 3.6 Brand Icons

`lucide-react` does **not** export `Github`, `Linkedin`, or `Twitter` icons. Use the custom SVG components from `@/components/icons`:

```tsx
import { GithubIcon, LinkedinIcon, TwitterIcon } from '@/components/icons'
```

---

## 4. Directory Map

```
├── app/
│   ├── globals.css              # Tailwind v4 @theme + oklch color tokens
│   ├── layout.tsx               # Root layout: fonts only, no providers
│   ├── page.tsx                 # Legacy root page (also rendered by [locale])
│   ├── sitemap.ts               # Dynamic sitemap (home + blog + case studies)
│   ├── robots.ts                # robots.txt
│   ├── manifest.ts              # PWA manifest
│   └── [locale]/
│       ├── layout.tsx           # Locale layout: i18n provider, theme, metadata, analytics
│       ├── page.tsx             # Homepage: all sections composed
│       ├── blog/
│       │   ├── page.tsx         # Blog listing
│       │   └── [slug]/page.tsx  # Blog post detail (MDX rendered)
│       └── work/
│           └── [slug]/page.tsx  # Case study detail (MDX rendered)
├── components/
│   ├── icons.tsx                # Custom SVG brand icons (GitHub, LinkedIn, Twitter/X)
│   ├── json-ld.tsx              # Structured data (Person + WebSite schemas)
│   ├── locale-switcher.tsx      # EN/VI toggle button
│   ├── mdx-remote.tsx           # MDX rendering wrapper
│   ├── motion.tsx               # FadeIn, FadeInStagger, FadeInStaggerItem
│   ├── section.tsx              # Section + SectionHeader layout primitives
│   ├── theme-provider.tsx       # next-themes wrapper
│   ├── theme-toggle.tsx         # Dark/light toggle
│   ├── layout/
│   │   ├── navbar.tsx           # Sticky nav with mobile sheet
│   │   └── footer.tsx           # Footer with social links
│   ├── sections/
│   │   ├── hero.tsx             # Hero with animated entrance
│   │   ├── about.tsx            # Stats grid
│   │   ├── skills.tsx           # Bento grid skill cards
│   │   ├── experience.tsx       # Timeline
│   │   ├── projects.tsx         # Alternating project showcase
│   │   ├── certifications.tsx   # Card grid
│   │   └── contact.tsx          # Form with client-side validation
│   └── ui/                      # shadcn/ui primitives (DO NOT manually edit)
├── content/
│   ├── blog/                    # MDX blog posts
│   └── case-studies/            # MDX case studies
├── data/                        # Static data objects
│   ├── profile.ts               # Name, role, bio, contact info
│   ├── navigation.ts            # Nav items array
│   ├── skills.ts                # Skill groups
│   ├── experiences.ts           # Work history
│   ├── projects.ts              # Featured projects
│   ├── certifications.ts        # Certifications
│   └── social-links.ts          # Social media links
├── i18n/
│   ├── config.ts                # locales, defaultLocale, Locale type
│   ├── request.ts               # getRequestConfig for server
│   ├── routing.ts               # defineRouting configuration
│   └── navigation.ts            # createNavigation exports (Link, useRouter, etc.)
├── lib/
│   ├── content.ts               # Blog/case-study file readers (server only)
│   ├── site-config.ts           # Centralized site metadata (url, og, description)
│   └── utils.ts                 # cn() utility (clsx + tailwind-merge)
├── messages/
│   ├── en.json                  # English translations
│   └── vi.json                  # Vietnamese translations
├── types/
│   ├── index.ts                 # Profile, SocialLink, Skill, Experience, Project, etc.
│   └── content.ts               # BlogPost, CaseStudy interfaces
├── proxy.ts                     # next-intl middleware (Next.js 16 "proxy" convention)
├── mdx-components.tsx           # Custom MDX component mappings
├── next.config.ts               # withNextIntl(withMDX(config))
└── public/images/               # Static images
```

---

## 5. Common Tasks — How To

### Add a new blog post

1. Create `content/blog/<slug>.mdx` with the frontmatter schema above.
2. The sitemap and blog listing update automatically.

### Add a new case study

1. Create `content/case-studies/<slug>.mdx` with the frontmatter schema above.
2. The sitemap and case study routes update automatically.

### Add a new section to the homepage

1. Create `components/sections/<name>.tsx` (use `Section` + `SectionHeader` from `@/components/section`).
2. Add `"use client"` if it needs interactivity.
3. Import `useTranslations` from `next-intl` for any visible strings.
4. Add translation keys to both `messages/en.json` and `messages/vi.json`.
5. Import and add the component in `app/[locale]/page.tsx`.

### Add a new page

1. Create `app/[locale]/<path>/page.tsx`.
2. Include `<Navbar />` and `<Footer />` for consistent layout.
3. Export `metadata` for SEO.
4. Add to `data/navigation.ts` if it should appear in the nav.

### Modify site metadata / domain

Edit `lib/site-config.ts` — it cascades to metadata, JSON-LD, sitemap, and OG images.

### Add a new shadcn/ui component

```bash
npx shadcn add <component-name>
```

Do NOT manually create files in `components/ui/`.

---

## 6. Build & Run Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

---

## 7. Known Gotchas

| Issue                                         | Cause                                         | Fix                                                          |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `asChild` doesn't work on Button/SheetTrigger | shadcn v4 uses base-ui, not Radix             | Use `render={<Component />}` prop instead                    |
| `Github`/`Linkedin`/`Twitter` import errors   | Removed from lucide-react                     | Use custom icons from `@/components/icons`                   |
| Arbitrary Tailwind values lint warnings       | Tailwind v4 prefers built-in utilities        | Use `h-125` not `h-[500px]`, etc.                            |
| `middleware.ts` deprecation warning           | Next.js 16 renamed to `proxy.ts`              | File is already `proxy.ts` with named `proxy` export         |
| `locale` type is `string \| undefined`        | `requestLocale` can be undefined              | Use `hasLocale()` from `next-intl` to narrow type            |
| `app/page.tsx` still exists at root           | Legacy file coexists with `[locale]/page.tsx` | Both render the same content; root catches non-locale routes |

---

## 8. Environment Variables

| Variable               | Required | Description                                       |
| ---------------------- | -------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | No       | Production URL. Defaults to `https://hayes.io.vn` |

---

## 9. Deployment

- **Platform**: Vercel (recommended)
- **Build command**: `next build`
- **Output**: Static + SSR hybrid
- **Analytics**: `@vercel/analytics` auto-detects Vercel environment
