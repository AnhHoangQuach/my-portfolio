import type { Metadata } from 'next'
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
import { localeAlternates } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return { alternates: localeAlternates(locale) }
}

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <JsonLd />
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
