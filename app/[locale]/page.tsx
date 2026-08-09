import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteHeader } from '@/components/layout/site-header'
import { Footer } from '@/components/layout/footer'
import { BackgroundGlow } from '@/components/layout/background-glow'
import { HeroSection } from '@/components/sections/hero'
import { AboutSection } from '@/components/sections/about'
import { ExperienceSection } from '@/components/sections/experience'
import { ProjectsSection } from '@/components/sections/projects'
import { ExpertiseSection } from '@/components/sections/expertise'
import { PracticeSection } from '@/components/sections/practice'
import { PrinciplesSection } from '@/components/sections/principles'
import { ContactSection } from '@/components/sections/contact'
import { JsonLd } from '@/components/json-ld'
import { buildPageMetadata } from '@/lib/metadata'
import { personSchema, profilePageSchema, websiteSchema } from '@/lib/schema'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return buildPageMetadata({
    locale,
    // `absoluteTitle` bypasses the `%s | Quach Hoang Anh (Hayes)` template —
    // the homepage title already carries both names, and running it through
    // the template would repeat them and blow past the SERP truncation point.
    absoluteTitle: t('homeTitle'),
    description: t('siteDescription'),
    type: 'profile',
  })
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="relative overflow-x-clip">
      {/* Person + WebSite + ProfilePage, cross-linked by @id. This is what
          lets Google resolve "Quach Hoang Anh", "Hayes" and the GitHub /
          LinkedIn profiles into a single entity. */}
      <JsonLd schema={[personSchema(), websiteSchema(locale), profilePageSchema(locale)]} />
      <BackgroundGlow />
      <SiteHeader />

      <main id="top" className="relative z-1 mx-auto max-w-310 px-5 sm:px-6 lg:px-7">
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
        <ExpertiseSection />
        <PracticeSection />
        <PrinciplesSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  )
}
