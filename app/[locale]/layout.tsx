import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { siteConfig } from '@/lib/site-config'
import { routing } from '@/i18n/routing'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Quach Hoang Anh | Senior Fullstack Engineer — hayes.io.vn',
    template: '%s | Quach Hoang Anh — hayes.io.vn',
  },
  description: siteConfig.description,
  keywords: [
    'Quach Hoang Anh',
    'hayes.io.vn',
    'senior fullstack engineer',
    'fullstack developer',
    'software engineer portfolio',
    'react developer',
    'next.js developer',
    'node.js developer',
    'golang developer',
    'typescript developer',
    'kafka',
    'aws cloud engineer',
    'microservices architect',
    'distributed systems',
    'kubernetes',
    'docker',
    'postgresql',
    'redis',
    'mongodb',
    'nestjs',
    'frontend engineer',
    'backend engineer',
    'vietnam software engineer',
    'ho chi minh city developer',
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
    locale: 'en_US',
    url: siteConfig.url,
    siteName: 'Quach Hoang Anh — Senior Fullstack Engineer',
    title: 'Quach Hoang Anh | Senior Fullstack Engineer',
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Quach Hoang Anh — Senior Fullstack Engineer Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quach Hoang Anh | Senior Fullstack Engineer',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@quachhoanganh',
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      en: siteConfig.url,
      vi: `${siteConfig.url}/vi`,
    },
  },
  category: 'technology',
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

  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <Analytics />
    </NextIntlClientProvider>
  )
}
