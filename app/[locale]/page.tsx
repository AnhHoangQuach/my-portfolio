import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero'
import { AboutSection } from '@/components/sections/about'
import { SkillsSection } from '@/components/sections/skills'
import { ExperienceSection } from '@/components/sections/experience'
import { ProjectsSection } from '@/components/sections/projects'
import { CertificationsSection } from '@/components/sections/certifications'
import { ContactSection } from '@/components/sections/contact'
import { JsonLd } from '@/components/json-ld'

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <CertificationsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
