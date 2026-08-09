import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowUpRight, CalendarDays, Clock } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { getBlogPost, getBlogPosts, getRelatedPosts } from '@/lib/content'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'
import { MDXRemote } from '@/components/mdx-remote'
import { JsonLd } from '@/components/json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { buildPageMetadata } from '@/lib/metadata'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'
import { profile } from '@/data/profile'

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getBlogPost(slug)

  // A missing or unpublished post must not inherit the layout's indexable
  // defaults while the route renders a 404.
  if (!post) return { title: 'Not found', robots: { index: false, follow: false } }

  return buildPageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.meta.title,
    description: post.meta.description,
    type: 'article',
    publishedTime: post.meta.date,
    tags: post.meta.tags,
    generatedImage: true,
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = getBlogPost(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug, post.meta.tags)

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        schema={[
          breadcrumbSchema(locale, [
            { name: 'Home', path: '' },
            { name: 'Blog', path: '/blog' },
            { name: post.meta.title, path: `/blog/${slug}` },
          ]),
          articleSchema({
            locale,
            path: `/blog/${slug}`,
            headline: post.meta.title,
            description: post.meta.description,
            datePublished: post.meta.date,
            keywords: post.meta.tags,
          }),
        ]}
      />
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1">
        <article className="mx-auto max-w-3xl px-6 pt-16 pb-20 lg:pt-24">
          <Breadcrumbs
            trail={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: post.meta.title },
            ]}
          />

          <header className="mt-8 mb-10">
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-balance">
              {post.meta.title}
            </h1>
            <p className="mt-4 text-lg leading-[1.6] text-dim text-pretty">
              {post.meta.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-xs text-faint">
              {/* Named author on the byline, matching the `author` node in the
                  BlogPosting schema — the E-E-A-T signal Google looks for on
                  technical writing. */}
              <span>{profile.name}</span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <time dateTime={post.meta.date}>
                  {new Date(post.meta.date).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {post.meta.readingTime} min read
              </span>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {post.meta.tags.map((tag: string) => (
                <li key={tag}>
                  <Badge variant="secondary">{tag}</Badge>
                </li>
              ))}
            </ul>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote source={post.content} />
          </div>

          <footer className="mt-16 border-t border-hairline pt-10">
            {related.length > 0 && (
              <>
                <h2 className="font-mono text-[0.69rem] tracking-[0.16em] text-faint uppercase">
                  Related reading
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {related.map((other) => (
                    <li key={other.slug}>
                      <Link
                        href={`/blog/${other.slug}`}
                        className="inline-flex items-start gap-1.5 text-sm font-medium text-brand-cyan transition-colors hover:text-brand-violet"
                      >
                        {other.title}
                        <ArrowUpRight className="size-4 flex-none translate-y-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <Link
                href="/blog"
                className="text-dim transition-colors hover:text-foreground"
              >
                All writing
              </Link>
              <Link href="/work" className="text-dim transition-colors hover:text-foreground">
                Case studies
              </Link>
              <Link href="/#contact" className="text-dim transition-colors hover:text-foreground">
                Get in touch
              </Link>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  )
}
