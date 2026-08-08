import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseStudy, getCaseStudies } from '@/lib/content'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { ArrowLeft, CalendarDays, ExternalLink } from 'lucide-react'
import { GithubIcon } from '@/components/icons'
import { MDXRemote } from '@/components/mdx-remote'
import { localeAlternates } from '@/lib/metadata'

export async function generateStaticParams() {
  const studies = getCaseStudies()
  return studies.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}
  return {
    title: study.meta.title,
    description: study.meta.description,
    openGraph: {
      title: study.meta.title,
      description: study.meta.description,
      type: 'article',
    },
    alternates: localeAlternates(locale, `/work/${slug}`),
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  return (
    <>
      <SiteHeader />
      <main id="top">
        <article className="mx-auto max-w-3xl px-6 pt-32 pb-20">
          <Link
            href="/#projects"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{study.meta.title}</h1>
            {study.meta.subtitle && (
              <p className="text-xl text-muted-foreground mb-4">{study.meta.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {new Date(study.meta.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {study.meta.liveUrl && (
                <a
                  href={study.meta.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Site
                </a>
              )}
              {study.meta.githubUrl && (
                <a
                  href={study.meta.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <GithubIcon className="h-4 w-4" />
                  Source
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {study.meta.techStack.map((tech: string) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote source={study.content} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
