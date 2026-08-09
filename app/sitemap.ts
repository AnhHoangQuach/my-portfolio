import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/site-config'
import { getBlogPosts, getCaseStudies } from '@/lib/content'
import { projects } from '@/data/projects'
import { routing } from '@/i18n/routing'

const siteUrl = siteConfig.url

/** hreflang map for a path, derived from the routing config. */
function languagesFor(path: string) {
  return Object.fromEntries(
    routing.locales.map((l) => [
      l,
      l === routing.defaultLocale ? `${siteUrl}${path}` : `${siteUrl}/${l}${path}`,
    ]),
  )
}

/**
 * One entry per path, always carrying its hreflang alternates. Blog posts and
 * case studies used to be emitted without them, so Google saw the /ja variants
 * as unrelated duplicate pages.
 */
function entry(
  path: string,
  options: {
    lastModified: Date
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    ...options,
    alternates: { languages: languagesFor(path) },
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getBlogPosts()
  const studies = getCaseStudies()

  // Newest piece of content, used as the index pages' lastmod. Previously the
  // homepage reported `new Date()`, so every redeploy claimed the whole site
  // had changed — a signal Google learns to discount.
  const newest = (dates: string[], fallback: Date) =>
    dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : fallback

  const buildDate = new Date()
  const latestPost = newest(
    posts.map((p) => p.date),
    buildDate,
  )
  const latestStudy = newest(
    studies.map((s) => s.date),
    buildDate,
  )

  return [
    entry('', { lastModified: buildDate, changeFrequency: 'monthly', priority: 1 }),
    entry('/work', { lastModified: latestStudy, changeFrequency: 'monthly', priority: 0.9 }),
    entry('/blog', { lastModified: latestPost, changeFrequency: 'weekly', priority: 0.8 }),
    ...projects.map((project) =>
      entry(`/work/${project.slug}`, {
        lastModified: buildDate,
        changeFrequency: 'yearly',
        priority: 0.8,
      }),
    ),
    ...studies.map((study) =>
      entry(`/work/${study.slug}`, {
        lastModified: new Date(study.date),
        changeFrequency: 'yearly',
        priority: 0.7,
      }),
    ),
    ...posts.map((post) =>
      entry(`/blog/${post.slug}`, {
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.7,
      }),
    ),
  ]
}
