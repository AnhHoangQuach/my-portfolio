import { useTranslations } from 'next-intl'

import { Navbar } from '@/components/layout/navbar'
import { NAV_LABEL_KEYS, type NavLabels } from '@/components/layout/nav-labels'

/**
 * Server-side wrapper that resolves the navbar's strings and hands them to the
 * client component as plain props. Every page renders this, never `Navbar`.
 */
export function SiteHeader() {
  const t = useTranslations('nav')
  const labels = Object.fromEntries(NAV_LABEL_KEYS.map((k) => [k, t(k)])) as NavLabels

  return <Navbar labels={labels} />
}
