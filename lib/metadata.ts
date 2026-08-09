import type { Metadata } from 'next'

import { siteConfig } from './site-config'
import { routing } from '@/i18n/routing'

/** BCP-47 → Open Graph locale. */
const OG_LOCALE: Record<string, string> = { en: 'en_US', ja: 'ja_JP' }

export function ogLocale(locale: string) {
  return OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale]
}

/** Absolute URL for `path` in `locale`, honouring the `as-needed` prefix. */
export function localeUrl(locale: string, path = '') {
  return locale === routing.defaultLocale
    ? `${siteConfig.url}${path}`
    : `${siteConfig.url}/${locale}${path}`
}

/**
 * Canonical + hreflang for one route, in one locale.
 *
 * This has to be set per page: `alternates` declared on the locale layout is
 * inherited by every child route, which would canonicalise the blog and every
 * case study to the homepage — and point the Japanese pages at the English
 * URL. Both are silent SEO bugs.
 *
 * @param locale current locale
 * @param path route path with a leading slash, or '' for the homepage
 */
export function localeAlternates(locale: string, path = ''): Metadata['alternates'] {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)]))

  return {
    canonical: localeUrl(locale, path),
    languages: { ...languages, 'x-default': localeUrl(routing.defaultLocale, path) },
  }
}

interface PageMetadataInput {
  locale: string
  /** Route path with a leading slash, or '' for the homepage. */
  path?: string
  /** Fed through the parent `title.template` unless `absoluteTitle` is set. */
  title?: string
  /** Bypasses the template — use for the homepage, which is its own brand line. */
  absoluteTitle?: string
  description: string
  /** Defaults to the site-wide OG image. */
  image?: string
  imageAlt?: string
  /**
   * Set on routes that ship an `opengraph-image.tsx`. Declaring `images` here
   * *overrides* the file convention, so the per-post card would be generated
   * and then never referenced — leave the field unset and Next fills it in.
   */
  generatedImage?: boolean
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  /** Set on pages that must never be indexed (404, drafts). */
  noIndex?: boolean
}

/**
 * Single source of truth for per-page metadata. Every route builds its tags
 * through this so canonical, hreflang, Open Graph and Twitter can never drift
 * apart — the failure mode when each page hand-rolls its own object.
 */
export function buildPageMetadata({
  locale,
  path = '',
  title,
  absoluteTitle,
  description,
  image = siteConfig.ogImage,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags,
  noIndex,
  generatedImage,
}: PageMetadataInput): Metadata {
  const url = localeUrl(locale, path)
  const resolvedTitle = absoluteTitle ?? title

  // For a generated card, point at the canonical URL rather than letting the
  // file convention derive one. Left to itself Next emits the prefixed
  // `/en/…/opengraph-image`, which the `as-needed` proxy answers with a 307 —
  // and a scraper that does not follow redirects shows no preview at all.
  const imageUrl = generatedImage ? `${url}/opengraph-image` : image

  const images = {
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: imageAlt ?? `${resolvedTitle} — ${siteConfig.name} (${siteConfig.alternateName})`,
      },
    ],
  }

  return {
    ...(absoluteTitle ? { title: { absolute: absoluteTitle } } : title ? { title } : {}),
    description,
    alternates: localeAlternates(locale, path),
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: type === 'profile' ? 'profile' : type,
      locale: ogLocale(locale),
      url,
      siteName: `${siteConfig.name} (${siteConfig.alternateName}) — Senior Software Engineer`,
      title: resolvedTitle,
      description,
      ...images,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  }
}
