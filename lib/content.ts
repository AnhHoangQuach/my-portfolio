import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { BlogPost, CaseStudy } from '@/types/content'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const BLOG_DIR = path.join(CONTENT_DIR, 'blog')
const CASE_STUDIES_DIR = path.join(CONTENT_DIR, 'case-studies')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getBlogPosts(): BlogPost[] {
  ensureDir(BLOG_DIR)
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '')
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      const stats = readingTime(content)

      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        tags: data.tags || [],
        readingTime: Math.ceil(stats.minutes),
        published: data.published !== false,
      } satisfies BlogPost
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBlogPost(slug: string) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  // A draft must 404, not merely drop out of the listing. It used to render at
  // its own URL — reachable by anyone with the link, and indexable the moment
  // one of them shared it.
  if (data.published === false) return null

  return {
    meta: {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      readingTime: Math.ceil(stats.minutes),
      published: data.published !== false,
    } satisfies BlogPost,
    content,
  }
}

export function getCaseStudies(): CaseStudy[] {
  ensureDir(CASE_STUDIES_DIR)
  const files = fs.readdirSync(CASE_STUDIES_DIR).filter((f) => f.endsWith('.mdx'))

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '')
      const raw = fs.readFileSync(path.join(CASE_STUDIES_DIR, file), 'utf-8')
      const { data } = matter(raw)

      return {
        slug,
        title: data.title || slug,
        subtitle: data.subtitle || '',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        techStack: data.techStack || [],
        liveUrl: data.liveUrl,
        githubUrl: data.githubUrl,
        published: data.published !== false,
      } satisfies CaseStudy
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getCaseStudy(slug: string) {
  const filePath = path.join(CASE_STUDIES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  // Same rule as blog drafts: unpublished means unreachable, not just unlisted.
  if (data.published === false) return null

  return {
    meta: {
      slug,
      title: data.title || slug,
      subtitle: data.subtitle || '',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      techStack: data.techStack || [],
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      published: data.published !== false,
    } satisfies CaseStudy,
    content,
  }
}

/**
 * Posts sharing at least one tag with `slug`, most overlap first. Powers the
 * "related reading" links, which is how a blog post stops being a leaf node in
 * the crawl graph.
 */
export function getRelatedPosts(slug: string, tags: string[], limit = 3): BlogPost[] {
  return getBlogPosts()
    .filter((post) => post.slug !== slug)
    .map((post) => ({ post, overlap: post.tags.filter((tag) => tags.includes(tag)).length }))
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.post)
}
