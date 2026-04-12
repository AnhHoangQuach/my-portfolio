'use client'

import Link from 'next/link'
import { ArrowRight, Download, Mail } from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion'
import { profile } from '@/data/profile'
import { socialLinks } from '@/data/social-links'
import { useTranslations } from 'next-intl'

const iconMap: Record<string, React.ElementType> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  mail: Mail,
}

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-6 md:px-8"
    >
      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-size-[40px_40px] opacity-30" />

      {/* Gradient blobs */}
      <div className="pointer-events-none absolute -top-40 right-0 h-125 w-125 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-100 w-100 rounded-full bg-primary/3 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl py-24 lg:py-32">
        <FadeIn>
          <p className="mb-4 text-sm font-medium tracking-widest text-primary uppercase">
            {profile.role}
          </p>
        </FadeIn>

        <FadeIn transition={{ delay: 0.1 }}>
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            {profile.name.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-primary">{profile.name.split(' ').pop()}</span>
          </h1>
        </FadeIn>

        <FadeIn transition={{ delay: 0.2 }}>
          <p className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl">
            {profile.tagline}
          </p>
        </FadeIn>

        <FadeIn transition={{ delay: 0.3 }}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {profile.bio}
          </p>
        </FadeIn>

        <FadeIn transition={{ delay: 0.4 }}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" nativeButton={false} render={<Link href="#work" />}>
              {t('viewProjects')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="#contact" />}
            >
              {t('contactMe')}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              nativeButton={false}
              render={<Link href={profile.resumeUrl} />}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('downloadCv')}
            </Button>
          </div>
        </FadeIn>

        <FadeIn transition={{ delay: 0.5 }}>
          <div className="mt-12 flex items-center gap-4">
            {socialLinks
              .filter((l) => ['github', 'linkedin', 'mail'].includes(l.icon))
              .map((link) => {
                const Icon = iconMap[link.icon]
                return (
                  <Link
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name}
                    className="rounded-full border border-border/40 p-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                  </Link>
                )
              })}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
