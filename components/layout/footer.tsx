'use client'

import { Link } from '@/i18n/navigation'
import { Mail, ArrowUp } from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { socialLinks } from '@/data/social-links'
import { profile } from '@/data/profile'
import { useTranslations } from 'next-intl'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  mail: Mail,
}

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <div className="text-lg font-bold tracking-tight">
              {profile.name.split(' ').pop()}
              <span className="text-primary">.</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              © {new Date().getFullYear()} {profile.name}. {t('builtWith')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = iconMap[link.icon]
              if (!Icon) return null
              return (
                <Link
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              )
            })}
            <Separator orientation="vertical" className="mx-2 h-6" />
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href="#top" aria-label="Back to top" />}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
