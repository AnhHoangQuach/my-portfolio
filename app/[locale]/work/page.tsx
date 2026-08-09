import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'
import { SectionEyebrow, SectionLead, SectionTitle } from '@/components/section'
import { Reveal, RevealGroup } from '@/components/reveal'
import { JsonLd } from '@/components/json-ld'
import { buildPageMetadata } from '@/lib/metadata'
import { breadcrumbSchema, itemListSchema } from '@/lib/schema'
import { projects } from '@/data/projects'
import { getCaseStudies } from '@/lib/content'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return buildPageMetadata({
    locale,
    path: '/work',
    title: t('workTitle'),
    description: t('workDescription'),
  })
}

/**
 * Index for /work. Before this existed the three real systems lived only as
 * sections of the one-pager, so they competed with each other for a single
 * URL's ranking signals and none of them could be linked to directly.
 */
export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('seo')
  const tp = await getTranslations('projects')
  const studies = getCaseStudies()

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        schema={[
          breadcrumbSchema(locale, [
            { name: 'Home', path: '' },
            { name: 'Work', path: '/work' },
          ]),
          itemListSchema(locale, [
            ...projects.map((p) => ({ name: p.title, path: `/work/${p.slug}` })),
            ...studies.map((s) => ({ name: s.title, path: `/work/${s.slug}` })),
          ]),
        ]}
      />
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1 mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
        <section className="pt-16 pb-24 lg:pt-24">
          <Reveal>
            <SectionEyebrow index="—">{tp('eyebrow')}</SectionEyebrow>
            <SectionTitle as="h1" className="max-w-[20ch]">
              {t('workTitle')}
            </SectionTitle>
            <SectionLead className="mb-14 max-w-[64ch]">{t('workDescription')}</SectionLead>
          </Reveal>

          <RevealGroup className="grid gap-5.5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Reveal key={project.slug}>
                <Link href={`/work/${project.slug}`} className="group block h-full">
                  <article className="bg-panel-gradient flex h-full flex-col gap-4 rounded-2xl border border-hairline p-6 transition-colors duration-350 group-hover:border-brand-cyan/40">
                    <p className="font-mono text-[0.69rem] tracking-[0.12em] text-brand-cyan">
                      {project.tag}
                    </p>

                    <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] transition-colors group-hover:text-brand-cyan">
                      {project.title}
                    </h2>

                    <p className="flex-1 text-sm leading-[1.65] text-faint text-pretty">
                      {project.summary}
                    </p>

                    <ul className="flex flex-wrap gap-2">
                      {project.techStack.slice(0, 5).map((tech) => (
                        <li
                          key={tech}
                          className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-dim"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>

                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan">
                      {tp('caseStudy')}
                      <ArrowUpRight className="size-4" />
                    </span>
                  </article>
                </Link>
              </Reveal>
            ))}

            {studies.map((study) => (
              <Reveal key={study.slug}>
                <Link href={`/work/${study.slug}`} className="group block h-full">
                  <article className="bg-panel-gradient flex h-full flex-col gap-4 rounded-2xl border border-hairline p-6 transition-colors duration-350 group-hover:border-brand-cyan/40">
                    <p className="font-mono text-[0.69rem] tracking-[0.12em] text-brand-violet">
                      {tp('caseStudy')}
                    </p>
                    <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] transition-colors group-hover:text-brand-cyan">
                      {study.title}
                    </h2>
                    <p className="flex-1 text-sm leading-[1.65] text-faint text-pretty">
                      {study.description}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {study.techStack.slice(0, 5).map((tech) => (
                        <li
                          key={tech}
                          className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-dim"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Link>
              </Reveal>
            ))}
          </RevealGroup>
        </section>
      </main>

      <Footer />
    </div>
  )
}
