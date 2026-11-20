import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/site-config'
import { routing } from '@/i18n/routing'

/** The site is a single page — the 3D world — in each locale. */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [
      l,
      l === routing.defaultLocale ? siteConfig.url : `${siteConfig.url}/${l}`,
    ]),
  )
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages },
    },
  ]
}
