import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/site-config'
import { getBlogPosts, getCaseStudies } from '@/lib/content'

const siteUrl = siteConfig.url

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getBlogPosts()
  const studies = getCaseStudies()

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const caseStudyUrls: MetadataRoute.Sitemap = studies.map((study) => ({
    url: `${siteUrl}/work/${study.slug}`,
    lastModified: new Date(study.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogUrls,
    ...caseStudyUrls,
  ]
}
