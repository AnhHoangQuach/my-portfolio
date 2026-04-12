'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, FileText } from 'lucide-react'
import { GithubIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Section, SectionHeader } from '@/components/section'
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/motion'
import { projects } from '@/data/projects'
import { useTranslations } from 'next-intl'

export function ProjectsSection() {
  const t = useTranslations('projects')

  return (
    <Section id="work">
      <FadeIn>
        <SectionHeader title={t('title')} />
      </FadeIn>

      <FadeInStagger className="space-y-24">
        {projects.map((project, i) => (
          <FadeInStaggerItem key={project.title}>
            <div
              className={`grid items-center gap-12 lg:grid-cols-2 ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* Image */}
              <div className="group relative overflow-hidden rounded-xl border border-border/40">
                <div className="absolute -inset-4 rounded-xl bg-primary/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h3>
                <Badge variant="secondary" className="mt-3">
                  {project.subtitle}
                </Badge>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {project.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {project.caseStudyUrl && (
                    <Button nativeButton={false} render={<Link href={project.caseStudyUrl} />}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('caseStudy')}
                    </Button>
                  )}
                  {project.liveUrl && (
                    <Button
                      variant="ghost"
                      nativeButton={false}
                      render={
                        <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer" />
                      }
                    >
                      {t('liveDemo')}
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button
                      variant="ghost"
                      nativeButton={false}
                      render={
                        <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer" />
                      }
                    >
                      <GithubIcon className="mr-2 h-4 w-4" />
                      {t('viewCode')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </FadeInStaggerItem>
        ))}
      </FadeInStagger>
    </Section>
  )
}
