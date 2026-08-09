import type { Metadata } from 'next'
import { CalendarDays, Clock } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

// `Link` from `@/i18n/navigation`, not `next/link`: the bare one emits
// unprefixed hrefs, so every card on /ja/blog used to point back at the
// English URL — a cross-locale link leak on every post.
import { Link } from '@/i18n/navigation'
import { getBlogPosts } from '@/lib/content'
import { buildPageMetadata } from '@/lib/metadata'
import { breadcrumbSchema, itemListSchema } from '@/lib/schema'
import { SectionEyebrow, SectionLead, SectionTitle } from '@/components/section'
import { Reveal, RevealGroup } from '@/components/reveal'
import { JsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return buildPageMetadata({
    locale,
    path: '/blog',
    title: t('blogTitle'),
    description: t('blogDescription'),
  })
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('seo')
  const posts = getBlogPosts()

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        schema={[
          breadcrumbSchema(locale, [
            { name: 'Home', path: '' },
            { name: 'Blog', path: '/blog' },
          ]),
          itemListSchema(
            locale,
            posts.map((post) => ({ name: post.title, path: `/blog/${post.slug}` })),
          ),
        ]}
      />
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1 mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
        <section className="pt-16 pb-24 lg:pt-24">
          <Reveal>
            <SectionEyebrow index="—">Writing</SectionEyebrow>
            {/* Was an `h2`, which left this route with no `h1` at all. */}
            <SectionTitle as="h1" className="max-w-[18ch]">
              {t('blogTitle')}
            </SectionTitle>
            <SectionLead className="mb-14 max-w-[64ch]">{t('blogDescription')}</SectionLead>
          </Reveal>

          <RevealGroup className="grid gap-5.5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Reveal key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <article className="bg-panel-gradient flex h-full flex-col gap-4 rounded-2xl border border-hairline p-6 transition-colors duration-350 group-hover:border-brand-cyan/40">
                    <div className="flex items-center gap-4 font-mono text-[0.69rem] text-faint">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
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
