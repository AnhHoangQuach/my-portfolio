import type { Metadata } from 'next'

import { siteConfig } from './site-config'
import { routing } from '@/i18n/routing'

/**
 * Canonical + hreflang for one route, in one locale.
 *
 * This has to be set per page: `alternates` declared on the locale layout is
 * inherited by every child route, which would canonicalise the blog and every
 * case study to the homepage — and point the Vietnamese pages at the English
 * URL. Both are silent SEO bugs.
 *
 * @param locale current locale
 * @param path route path with a leading slash, or '' for the homepage
 */
export function localeAlternates(locale: string, path = ''): Metadata['alternates'] {
  const href = (l: string) =>
    l === routing.defaultLocale ? `${siteConfig.url}${path}` : `${siteConfig.url}/${l}${path}`

  const languages = Object.fromEntries(routing.locales.map((l) => [l, href(l)]))

  return {
    canonical: href(locale),
    languages: { ...languages, 'x-default': href(routing.defaultLocale) },
  }
}
