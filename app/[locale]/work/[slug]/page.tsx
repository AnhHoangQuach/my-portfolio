import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'
import { GithubIcon } from '@/components/icons'
import { MDXRemote } from '@/components/mdx-remote'
import { ArchitectureFlow } from '@/components/architecture-flow'
import { JsonLd } from '@/components/json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { buildPageMetadata } from '@/lib/metadata'
import { breadcrumbSchema, projectSchema } from '@/lib/schema'
import { getCaseStudy, getCaseStudies } from '@/lib/content'
import { getProject, getRelatedProjects, projects } from '@/data/projects'

const PANEL_LABEL = 'font-mono text-[0.69rem] tracking-[0.16em] uppercase'

/**
 * /work/[slug] resolves against two sources: the structured projects in
 * `data/projects.ts` first, then long-form MDX case studies. Projects win a
 * collision — they are the canonical write-up of real, shipped work.
 */
export function generateStaticParams() {
  return [
    ...projects.map((project) => ({ slug: project.slug })),
    ...getCaseStudies().map((study) => ({ slug: study.slug })),
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params

  const project = getProject(slug)
  if (project) {
    return buildPageMetadata({
      locale,
      path: `/work/${slug}`,
      title: `${project.title} — ${project.company}`,
      description: project.summary,
      type: 'article',
      tags: project.techStack,
      generatedImage: true,
    })
  }

  const study = getCaseStudy(slug)
  if (!study) return { title: 'Not found', robots: { index: false, follow: false } }

  return buildPageMetadata({
    locale,
    path: `/work/${slug}`,
    title: study.meta.title,
    description: study.meta.description,
    type: 'article',
    publishedTime: study.meta.date,
    tags: study.meta.techStack,
    generatedImage: true,
  })
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const project = getProject(slug)
  if (project) return <ProjectPage locale={locale} slug={slug} />

  const study = getCaseStudy(slug)
  if (!study) notFound()

  const t = await getTranslations('caseStudy')

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        schema={[
          breadcrumbSchema(locale, [
            { name: 'Home', path: '' },
            { name: 'Work', path: '/work' },
            { name: study.meta.title, path: `/work/${slug}` },
          ]),
          projectSchema({
            locale,
            path: `/work/${slug}`,
            name: study.meta.title,
            description: study.meta.description,
            techStack: study.meta.techStack,
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
              { label: 'Work', href: '/work' },
              { label: study.meta.title },
            ]}
          />

          <header className="mt-8 mb-10">
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-balance">
              {study.meta.title}
            </h1>
            {study.meta.subtitle && (
              <p className="mt-3 text-xl text-dim text-pretty">{study.meta.subtitle}</p>
            )}
            <div className="mt-5 mb-4 flex flex-wrap items-center gap-4 font-mono text-xs text-faint">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <time dateTime={study.meta.date}>
                  {new Date(study.meta.date).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </span>
              {study.meta.liveUrl && (
                <a
                  href={study.meta.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                  Live Site
                </a>
              )}
              {study.meta.githubUrl && (
                <a
                  href={study.meta.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <GithubIcon className="size-3.5" />
                  Source
                </a>
              )}
            </div>
            <ul className="flex flex-wrap gap-2">
              {study.meta.techStack.map((tech: string) => (
                <li key={tech}>
                  <Badge variant="secondary">{tech}</Badge>
                </li>
              ))}
            </ul>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote source={study.content} />
          </div>

          <RelatedWork slug={slug} label={t('backToWork')} />
        </article>
      </main>

      <Footer />
    </div>
  )
}

/** The structured write-up rendered for entries in `data/projects.ts`. */
async function ProjectPage({ locale, slug }: { locale: string; slug: string }) {
  const project = getProject(slug)!
  const t = await getTranslations('projects')
  const related = getRelatedProjects(slug)

  return (
    <div className="relative overflow-x-clip">
      <JsonLd
        schema={[
          breadcrumbSchema(locale, [
            { name: 'Home', path: '' },
            { name: 'Work', path: '/work' },
            { name: project.title, path: `/work/${slug}` },
          ]),
          projectSchema({
            locale,
            path: `/work/${slug}`,
            name: project.title,
            description: project.summary,
            techStack: project.techStack,
          }),
        ]}
      />
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1 mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
        <article className="pt-16 pb-24 lg:pt-24">
          <Breadcrumbs
            trail={[
              { label: 'Home', href: '/' },
              { label: 'Work', href: '/work' },
              { label: project.title },
            ]}
          />

          <header className="mt-8 max-w-208">
            <p className="font-mono text-[0.72rem] tracking-[0.12em] text-brand-cyan">
              {project.tag}
            </p>
            <h1 className="mt-4 font-heading text-4xl leading-[1.04] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">
              {project.title}
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-[1.65] text-dim text-pretty">
              {project.summary}
            </p>

            {/* Role and dates as a definition list rather than prose: it is the
                first thing a recruiter scans, and it is what ties this page
                back to the matching entry in the experience section. */}
            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              <div className="border-l border-brand-cyan/30 pl-3.5">
                <dt className={`${PANEL_LABEL} text-faint`}>Role</dt>
                <dd className="mt-1.5 text-[0.94rem] text-foreground">{project.role}</dd>
              </div>
              <div className="border-l border-brand-cyan/30 pl-3.5">
                <dt className={`${PANEL_LABEL} text-faint`}>Company</dt>
                <dd className="mt-1.5 text-[0.94rem] text-foreground">{project.company}</dd>
              </div>
              <div className="border-l border-brand-cyan/30 pl-3.5">
                <dt className={`${PANEL_LABEL} text-faint`}>Period</dt>
                <dd className="mt-1.5 font-mono text-[0.94rem] text-foreground">
                  {project.period}
                </dd>
              </div>
            </dl>
          </header>

          <div className="mt-14 grid gap-7 md:grid-cols-2">
            <section className="bg-panel-gradient rounded-2xl border border-hairline p-6 lg:p-8">
              <h2 className={`${PANEL_LABEL} text-brand-violet`}>{t('problem')}</h2>
              <p className="mt-3 text-[0.98rem] leading-[1.7] text-dim text-pretty">
                {project.problem}
              </p>
            </section>
            <section className="bg-panel-gradient rounded-2xl border border-hairline p-6 lg:p-8">
              <h2 className={`${PANEL_LABEL} text-brand-cyan`}>{t('solution')}</h2>
              <p className="mt-3 text-[0.98rem] leading-[1.7] text-dim text-pretty">
                {project.solution}
              </p>
            </section>
          </div>

          <section className="mt-7 rounded-2xl border border-hairline bg-background/50 p-5 lg:p-7">
            <h2 className={`${PANEL_LABEL} mb-4 text-faint`}>{t('architecture')}</h2>
            <ArchitectureFlow nodes={project.nodes} label={t('architecture')} />
          </section>

          <div className="mt-7 grid items-start gap-7 md:grid-cols-2">
            <section>
              <h2 className={`${PANEL_LABEL} text-faint`}>{t('techStack')}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-dim"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`${PANEL_LABEL} text-faint`}>{t('impact')}</h2>
              <dl className="mt-3 flex flex-wrap gap-8">
                {project.impact.map((item) => (
                  <div key={item.label}>
                    <dt className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground lg:text-3xl">
                      {item.value}
                    </dt>
                    <dd className="mt-1 max-w-[26ch] text-[0.8rem] leading-[1.45] text-faint">
                      {item.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {related.length > 0 && (
            <section className="mt-16 border-t border-hairline pt-10">
              <h2 className={`${PANEL_LABEL} text-faint`}>More work</h2>
              <ul className="mt-5 grid gap-5.5 md:grid-cols-2">
                {related.map((other) => (
                  <li key={other.slug}>
                    <Link href={`/work/${other.slug}`} className="group block h-full">
                      <article className="bg-panel-gradient flex h-full flex-col gap-3 rounded-2xl border border-hairline p-6 transition-colors duration-350 group-hover:border-brand-cyan/40">
                        <p className="font-mono text-[0.69rem] tracking-[0.12em] text-brand-cyan">
                          {other.tag}
                        </p>
                        <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] transition-colors group-hover:text-brand-cyan">
                          {other.title}
                        </h3>
                        <p className="text-sm leading-[1.6] text-faint text-pretty">
                          {other.summary}
                        </p>
                      </article>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <Link
                  href="/#experience"
                  className="inline-flex items-center gap-1.5 font-medium text-brand-cyan transition-colors hover:text-brand-violet"
                >
                  Full experience at {project.company}
                  <ArrowUpRight className="size-4" />
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 font-medium text-brand-cyan transition-colors hover:text-brand-violet"
                >
                  Engineering notes
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  )
}

/** Return path shown at the foot of an MDX case study. */
function RelatedWork({ slug, label }: { slug: string; label: string }) {
  const related = getRelatedProjects(slug).slice(0, 2)

  return (
    <section className="mt-16 border-t border-hairline pt-10">
      <Link
        href="/work"
        className="inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {label}
      </Link>

      <ul className="mt-6 flex flex-col gap-3">
        {related.map((project) => (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan transition-colors hover:text-brand-violet"
            >
              {project.title}
              <ArrowUpRight className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
