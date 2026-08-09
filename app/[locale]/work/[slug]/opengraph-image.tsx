import { getCaseStudies, getCaseStudy } from '@/lib/content'
import { getProject, projects } from '@/data/projects'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og-image'
import { siteConfig } from '@/lib/site-config'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Case study preview'

export function generateStaticParams() {
  return [
    ...projects.map((project) => ({ slug: project.slug })),
    ...getCaseStudies().map((study) => ({ slug: study.slug })),
  ]
}

/** Mirrors the page's own two-source resolution: project first, then MDX. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const project = getProject(slug)
  if (project) {
    return renderOgImage({
      eyebrow: project.company,
      title: project.title,
      tags: project.techStack,
    })
  }

  const study = getCaseStudy(slug)
  return renderOgImage({
    eyebrow: 'Case Study',
    title: study?.meta.title ?? siteConfig.name,
    tags: study?.meta.techStack,
  })
}
