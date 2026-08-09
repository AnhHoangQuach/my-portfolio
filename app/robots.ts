import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Next's internal build assets and the Vercel toolbar carry no
        // indexable content; keeping crawlers out of them saves crawl budget
        // on a site this small.
        disallow: ['/api/', '/_next/', '/_vercel/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
