import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { siteConfig } from '@/lib/site-config'
import { ogLocale } from '@/lib/metadata'
import { routing } from '@/i18n/routing'
import { fontVariables } from '@/app/fonts'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// The world is always a sunny afternoon: one light palette, browser chrome
// tinted to match the sky behind the loading screen.
export const viewport: Viewport = {
  themeColor: '#A9D8E8',
  colorScheme: 'light',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      // Short enough to survive the SERP truncation at ~60 chars, and it leads
      // with the two names Google has to learn are the same person.
      default: t('siteTitle'),
      template: `%s | ${siteConfig.name} (${siteConfig.alternateName})`,
    },
    description: t('siteDescription'),
    applicationName: `${siteConfig.alternateName} — ${siteConfig.domain}`,
    // Deliberately short. `keywords` carries no weight with Google and a
    // 25-term list reads as stuffing to the engines that still parse it; these
    // are only the terms this site genuinely competes for.
    keywords: [
      'Quach Hoang Anh',
      'Hayes',
      'Hayes Software Engineer',
      'Senior Software Engineer',
      'Senior Next.js Developer',
      'Senior React Developer',
      'Full Stack Software Engineer Vietnam',
      'Software Engineer Da Nang',
      'NestJS developer',
      'Golang developer',
    ],
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      alternateLocale: routing.locales.filter((l) => l !== locale).map(ogLocale),
      url: siteConfig.url,
      siteName: `${siteConfig.name} (${siteConfig.alternateName}) — Senior Software Engineer`,
      title: t('siteTitle'),
      description: t('siteDescription'),
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} (${siteConfig.alternateName}) — Senior Software Engineer`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteTitle'),
      description: t('siteDescription'),
      images: [siteConfig.ogImage],
    },
    ...(siteConfig.googleSiteVerification
      ? { verification: { google: siteConfig.googleSiteVerification } }
      : {}),
    // `alternates` is intentionally absent: it is inherited by every child
    // route, so each page declares its own via `buildPageMetadata()`.
    category: 'technology',
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Publishes the locale to next-intl's server cache. Without it the server
  // hooks fall back to reading request headers, which forces every page in the
  // tree to render dynamically instead of prerendering at build time.
  setRequestLocale(locale)

  // The document shell lives here rather than in the root layout so that
  // `lang` comes from the route param — no request-header read, no opt-out of
  // static rendering.
  //
  // The provider is mounted for `locale` only — the client-side navigation
  // helpers in `@/i18n/navigation` read it. No `messages` prop: every Client
  // Component gets its strings as props, so the catalogue never enters the
  // browser payload.
  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh bg-[#bfe3ef] font-sans text-[#3e3a34] antialiased">
        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
