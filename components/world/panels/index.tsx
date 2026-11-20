import { useTranslations } from 'next-intl'
import { ArrowUpRight, FileText, Mail, MapPin } from 'lucide-react'

import { GithubIcon, LinkedinIcon } from '@/components/icons'
import { experiences } from '@/data/experiences'
import { expertiseAreas } from '@/data/expertise'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { siteConfig } from '@/lib/site-config'
import type { SectionId } from '@/lib/world/landmarks'
import { FireButton } from './actions'

/**
 * Panel bodies, rendered on the server. Headings and labels are translated;
 * CV content comes from `data/*.ts` in English, as on the rest of the site.
 */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-(--w-wood)/25 bg-(--w-paper) px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-(--w-wood-dark) uppercase first:mt-0">
      {children}
    </h3>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-(--w-wood)/20 bg-(--w-paper) px-3 py-2.5">
      <div className="font-heading text-xl font-bold" style={{ color: 'var(--accent)' }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs leading-snug text-(--w-ink-soft)">{label}</div>
    </div>
  )
}

function HomePanel() {
  const t = useTranslations('world.panels.home')
  const about = useTranslations('about')
  return (
    <div className="text-sm leading-relaxed">
      <p className="font-heading text-lg leading-snug font-semibold">{t('greeting')}</p>
      <p className="mt-2 text-(--w-ink-soft)">{t('intro')}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={`${profile.yearsOfExperience}+`} label={about('factYears')} />
        <Stat value={`${profile.companyCount}`} label={about('factCompanies')} />
        <Stat value={about('factLeadValue')} label={about('factLead')} />
      </div>
      <Heading>{t('dragonTitle')}</Heading>
      <p className="text-(--w-ink-soft)">{t('dragonBody')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <FireButton label={t('fire')} />
        <a href={profile.resumeUrl} className="world-btn world-btn-ghost px-4 py-2 text-sm">
          <FileText className="size-4" aria-hidden />
          {t('resume')}
        </a>
      </div>
    </div>
  )
}

function AboutPanel() {
  const t = useTranslations('world.panels.about')
  const about = useTranslations('about')
  return (
    <div className="text-sm leading-relaxed">
      <p className="font-heading text-lg leading-snug font-semibold">{about('title')}</p>
      <p className="mt-2 text-(--w-ink-soft)">{about('paragraphOne')}</p>
      <p className="mt-2 text-(--w-ink-soft)">{about('paragraphTwo')}</p>
      <Heading>{t('facts')}</Heading>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-(--w-ink-soft)">{t('location')}</dt>
        <dd className="flex items-center gap-1 font-medium">
          <MapPin className="size-3.5" aria-hidden />
          {profile.location}
        </dd>
        <dt className="text-(--w-ink-soft)">{t('education')}</dt>
        <dd className="font-medium">{profile.education}</dd>
        <dt className="text-(--w-ink-soft)">{t('credentials')}</dt>
        <dd className="font-medium">{profile.credentials}</dd>
        <dt className="text-(--w-ink-soft)">{t('languages')}</dt>
        <dd className="font-medium">{profile.languageProficiency}</dd>
      </dl>
    </div>
  )
}

function SkillsPanel() {
  const t = useTranslations('world.panels.skills')
  return (
    <div className="text-sm leading-relaxed">
      <p className="text-(--w-ink-soft)">{t('intro')}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {expertiseAreas.map((area) => (
          <li key={area.n} className="rounded-xl border border-(--w-wood)/20 bg-(--w-paper)/70 p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-(--w-ink-soft)">{area.n}</span>
              <h3 className="font-heading font-bold">{area.title}</h3>
            </div>
            <p className="mt-1 text-xs text-(--w-ink-soft)">{area.note}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {area.items.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectsPanel() {
  const t = useTranslations('world.panels.projects')
  return (
    <div className="text-sm leading-relaxed">
      <p className="text-(--w-ink-soft)">{t('intro')}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.slug} className="rounded-xl border border-(--w-wood)/20 bg-(--w-paper)/70 p-3">
            <p className="font-mono text-[10px] tracking-[0.16em] text-(--w-ink-soft) uppercase">{p.tag}</p>
            <h3 className="mt-0.5 font-heading text-base font-bold">{p.title}</h3>
            <p className="mt-1 text-xs text-(--w-ink-soft)">{p.summary}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {p.impact.map((i) => (
                <span key={i.label} className="text-xs">
                  <strong style={{ color: 'var(--accent)' }}>{i.value}</strong>{' '}
                  <span className="text-(--w-ink-soft)">{i.label}</span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExperiencePanel() {
  const t = useTranslations('world.panels.experience')
  return (
    <div className="text-sm leading-relaxed">
      <p className="text-(--w-ink-soft)">{t('intro')}</p>
      <ol className="relative mt-4 ml-2 border-l-2 border-dashed border-(--w-wood)/35">
        {experiences.map((e) => (
          <li key={`${e.company}-${e.period}`} className="relative mb-5 pl-5 last:mb-0">
            <span
              className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-(--w-paper)"
              style={{ background: 'var(--accent)' }}
              aria-hidden
            />
            <p className="font-mono text-[11px] text-(--w-ink-soft)">{e.period}</p>
            <h3 className="font-heading font-bold">{e.company}</h3>
            <p className="text-xs font-medium">{e.role}</p>
            <p className="mt-1 text-xs text-(--w-ink-soft)">{e.note}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-(--w-ink-soft)">
              {e.points.slice(0, 2).map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1">
              {e.techStack.slice(0, 5).map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ContactPanel() {
  const t = useTranslations('world.panels.contact')
  const contact = useTranslations('contact')
  const links = [
    { href: `mailto:${profile.email}`, label: profile.email, icon: <Mail className="size-4" aria-hidden /> },
    { href: siteConfig.links.github, label: 'GitHub', icon: <GithubIcon className="size-4" /> },
    { href: siteConfig.links.linkedin, label: 'LinkedIn', icon: <LinkedinIcon className="size-4" /> },
    { href: profile.resumeUrl, label: t('resume'), icon: <FileText className="size-4" aria-hidden /> },
  ]
  return (
    <div className="text-sm leading-relaxed">
      <p className="font-heading text-lg leading-snug font-semibold">{contact('title')}</p>
      <p className="mt-2 text-(--w-ink-soft)">{contact('description')}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="world-btn w-full gap-3 rounded-xl! border border-(--w-wood)/25 bg-(--w-paper) px-3 py-2.5 hover:-translate-y-0.5"
            >
              <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: 'var(--accent)' }}>
                {l.icon}
              </span>
              <span className="min-w-0 truncate text-sm">{l.label}</span>
              <ArrowUpRight className="ml-auto size-4 text-(--w-ink-soft)" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-(--w-ink-soft)">{t('note')}</p>
    </div>
  )
}

export function WorldPanels(): Record<SectionId, React.ReactNode> {
  return {
    home: <HomePanel />,
    about: <AboutPanel />,
    skills: <SkillsPanel />,
    projects: <ProjectsPanel />,
    experience: <ExperiencePanel />,
    contact: <ContactPanel />,
  }
}
