import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from '@/lib/content'
import { localeAlternates } from '@/lib/metadata'
import { SectionEyebrow, SectionLead, SectionTitle } from '@/components/section'
import { Reveal, RevealGroup } from '@/components/reveal'
import { CalendarDays, Clock } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Blog',
    description:
      'Articles about web development, software engineering, React, Next.js, TypeScript, and more.',
    alternates: localeAlternates(locale, '/blog'),
  }
}

export default function BlogPage() {
  const posts = getBlogPosts()

  return (
    <div className="relative overflow-x-clip">
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1 mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
        <section className="pt-16 pb-24 lg:pt-24">
          <Reveal>
            <SectionEyebrow index="—">Writing</SectionEyebrow>
            <SectionTitle className="max-w-[18ch]">
              Notes from production systems.
            </SectionTitle>
            <SectionLead className="mb-14">
              Thoughts on web development, software engineering, and technology.
            </SectionLead>
          </Reveal>

          <RevealGroup className="grid gap-5.5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Reveal key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <article className="bg-panel-gradient flex h-full flex-col gap-4 rounded-2xl border border-hairline p-6 transition-colors duration-350 group-hover:border-brand-cyan/40">
                    <div className="flex items-center gap-4 font-mono text-[0.69rem] text-faint">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {post.readingTime} min read
                      </span>
                    </div>

                    <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] transition-colors group-hover:text-brand-cyan">
                      {post.title}
                    </h2>
                    <p className="flex-1 text-sm leading-[1.65] text-faint text-pretty">
                      {post.description}
                    </p>

                    <ul className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-dim"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Link>
              </Reveal>
            ))}

            {posts.length === 0 && (
              <Reveal className="col-span-full">
                <p className="text-center text-faint">No posts yet. Check back soon!</p>
              </Reveal>
            )}
          </RevealGroup>
        </section>
      </main>

      <Footer />
    </div>
  )
}
