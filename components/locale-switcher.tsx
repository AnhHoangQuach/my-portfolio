'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { type Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  ja: 'JA',
}

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const nextLocale = locale === 'en' ? 'ja' : 'en'

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      // The accessible name must contain the visible label ("EN"), otherwise
      // voice-control users cannot address the control by what they see.
      aria-label={`${localeLabels[locale]} — switch to ${localeLabels[nextLocale]}`}
      className="gap-1.5"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{localeLabels[locale]}</span>
    </Button>
  )
}
