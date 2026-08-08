import { useTranslations } from 'next-intl'
import { ArrowUp } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { profile } from '@/data/profile'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
      <div className="mt-24 flex flex-wrap items-center justify-between gap-5 border-t border-hairline py-6.5 font-mono text-[0.72rem] text-faint">
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
