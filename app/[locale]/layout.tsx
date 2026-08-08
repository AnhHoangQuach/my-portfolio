import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { siteConfig } from '@/lib/site-config'
import { routing } from '@/i18n/routing'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/** BCP-47 → Open Graph locale. */
const OG_LOCALE: Record<string, string> = { en: 'en_US', ja: 'ja_JP' }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: 'Quach Hoang Anh | Senior Software Engineer — hayes.io.vn',
      template: '%s | Quach Hoang Anh — hayes.io.vn',
    },
    description: siteConfig.description,
    keywords: [
      'Quach Hoang Anh',
      'hayes.io.vn',
      'senior software engineer',
      'senior full-stack developer',
      'fullstack developer',
      'software engineer portfolio',
      'react developer',
      'next.js developer',
      'node.js developer',
      'nestjs developer',
      'typescript developer',
      'kafka',
      'aws cloud engineer',
      'microservices',
      'distributed systems',
      'kubernetes',
      'docker',
      'postgresql',
      'redis',
      'mongodb',
      'frontend engineer',
      'backend engineer',
      'vietnam software engineer',
      'da nang developer',
      'hire fullstack developer',
    ],
    authors: [{ name: 'Quach Hoang Anh', url: siteConfig.url }],
    creator: 'Quach Hoang Anh',
    publisher: 'Quach Hoang Anh',
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
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
      url: siteConfig.url,
      siteName: 'Quach Hoang Anh — Senior Software Engineer',
      title: 'Quach Hoang Anh | Senior Software Engineer',
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: 'Quach Hoang Anh — Senior Software Engineer Portfolio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Quach Hoang Anh | Senior Software Engineer',
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    // `alternates` is intentionally absent: it is inherited by every child
    // route, so each page declares its own via `localeAlternates()`.
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

  // The provider is mounted for `locale` only — the client-side `Link` from
  // `@/i18n/navigation` reads it. No `messages` prop: every Client Component
  // gets its strings as props (see components/layout/site-header.tsx), so the
  // catalogue never enters the browser payload.
  return (
    <NextIntlClientProvider locale={locale}>
      {children}
      <Analytics />
      <SpeedInsights />
    </NextIntlClientProvider>
  )
}
