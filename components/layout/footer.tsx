import { useTranslations } from 'next-intl'
import { ArrowUp } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { GithubIcon, LinkedinIcon } from '@/components/icons'
import { profile } from '@/data/profile'
import { siteConfig } from '@/lib/site-config'

export function Footer() {
  const t = useTranslations('footer')
  const nav = useTranslations('nav')

  // Sitewide internal links. Every leaf page (a blog post, a project) now
  // reaches /work, /blog and the homepage sections in one hop instead of
  // dead-ending, which is what keeps them out of the crawl-depth tail.
  const links = [
    { href: '/', label: nav('about') },
    { href: '/work', label: nav('work') },
    { href: '/blog', label: nav('blog') },
    { href: '/#experience', label: nav('experience') },
    { href: '/#expertise', label: nav('expertise') },
    { href: '/#contact', label: nav('contact') },
  ]

  return (
    <footer className="mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
      <div className="mt-24 flex flex-wrap items-start justify-between gap-8 border-t border-hairline pt-10">
        <div>
          {/* `alternateName` in prose, once, so the brand and the legal name
              co-occur on every page without reading as keyword stuffing. */}
          <p className="font-heading text-[0.97rem] font-semibold tracking-[-0.01em] text-foreground">
            {profile.name}{' '}
            <span className="text-faint">({siteConfig.alternateName})</span>
          </p>
          <p className="mt-1.5 text-[0.82rem] text-faint">
            {profile.role} · {profile.location}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`${profile.name} on GitHub`}
              className="text-faint transition-colors hover:text-foreground"
            >
              <GithubIcon className="size-4" />
            </a>
            <a
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`${profile.name} on LinkedIn`}
              className="text-faint transition-colors hover:text-foreground"
            >
              <LinkedinIcon className="size-4" />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="text-[0.82rem] text-faint transition-colors hover:text-foreground"
            >
              {profile.email}
            </a>
          </div>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[0.84rem] sm:grid-cols-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-faint transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-hairline py-6.5 font-mono text-[0.72rem] text-faint">
        <span>
          {profile.name} · {profile.location}
        </span>
        <span className="flex items-center gap-4">
          <span className="hidden sm:inline">
            {profile.education} · {profile.credentials}
          </span>
          <Link
            href="#top"
            aria-label={t('backToTop')}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowUp className="size-3.5" />
            {t('backToTop')}
          </Link>
        </span>
      </div>
    </footer>
  )
}
