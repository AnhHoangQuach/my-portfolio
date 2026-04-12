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
        image: data.image,
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

  return {
    meta: {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      readingTime: Math.ceil(stats.minutes),
      published: data.published !== false,
      image: data.image,
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
        image: data.image,
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

  return {
    meta: {
      slug,
      title: data.title || slug,
      subtitle: data.subtitle || '',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      techStack: data.techStack || [],
      image: data.image,
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      published: data.published !== false,
    } satisfies CaseStudy,
    content,
  }
}
