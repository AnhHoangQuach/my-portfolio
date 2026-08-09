import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Section, SectionEyebrow, SectionLead, SectionTitle } from '@/components/section'
import { Reveal } from '@/components/reveal'
import { ArchitectureFlow } from '@/components/architecture-flow'
import { projects } from '@/data/projects'

const PANEL_LABEL = 'font-mono text-[0.69rem] tracking-[0.16em] uppercase'

export function ProjectsSection() {
  const t = useTranslations('projects')

  return (
    <Section id="work">
      <Reveal>
        <SectionEyebrow index="03">{t('eyebrow')}</SectionEyebrow>
        <SectionTitle className="max-w-[18ch]">{t('title')}</SectionTitle>
        <SectionLead className="mb-14">{t('description')}</SectionLead>
      </Reveal>

      <div className="flex flex-col gap-7">
        {projects.map((project) => (
          <Reveal key={project.title}>
            <article className="bg-panel-gradient rounded-3xl border border-hairline p-6 transition-colors duration-450 hover:border-brand-cyan/35 sm:p-8 lg:p-11">
              <div className="flex flex-wrap items-baseline justify-between gap-5">
                <div>
                  <p className="font-mono text-[0.72rem] tracking-[0.12em] text-brand-cyan">
                    {project.tag}
                  </p>
                  {/* The title links to the project's own page. Without it
                      the three systems were reachable only as anchors on this
                      one URL, so none of them could rank on their own. */}
                  <h3 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.025em] sm:text-3xl lg:text-4xl">
                    <Link
                      href={`/work/${project.slug}`}
                      className="transition-colors hover:text-brand-cyan"
                    >
                      {project.title}
                    </Link>
                  </h3>
                </div>
                <p className="font-mono text-xs text-faint">{project.meta}</p>
              </div>

              <div className="mt-8 grid gap-7 md:grid-cols-2">
                <div>
                  <p className={`${PANEL_LABEL} text-brand-violet`}>{t('problem')}</p>
                  <p className="mt-2.5 text-[0.94rem] leading-[1.65] text-dim text-pretty">
                    {project.problem}
                  </p>
                </div>
                <div>
                  <p className={`${PANEL_LABEL} text-brand-cyan`}>{t('solution')}</p>
                  <p className="mt-2.5 text-[0.94rem] leading-[1.65] text-dim text-pretty">
                    {project.solution}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-hairline bg-background/50 p-5">
                <p className={`${PANEL_LABEL} mb-4 text-faint`}>{t('architecture')}</p>
                <ArchitectureFlow nodes={project.nodes} label={t('architecture')} />
              </div>

              <div className="mt-8 grid items-start gap-7 md:grid-cols-2">
                <div>
                  <p className={`${PANEL_LABEL} text-faint`}>{t('techStack')}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-dim"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className={`${PANEL_LABEL} text-faint`}>{t('impact')}</p>
                  <dl className="mt-3 flex flex-wrap gap-6">
                    {project.impact.map((item) => (
                      <div key={item.label}>
                        <dt className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground lg:text-3xl">
                          {item.value}
                        </dt>
                        <dd className="mt-1 max-w-[22ch] text-[0.78rem] leading-[1.45] text-faint">
                          {item.label}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <Link
                href={`/work/${project.slug}`}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan transition-colors hover:text-brand-violet"
              >
                {t('caseStudy')}
                <ArrowUpRight className="size-4" />
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <Link
          href="/work"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-dim transition-colors hover:text-foreground"
        >
          {t('allWork')}
          <ArrowUpRight className="size-4" />
        </Link>
      </Reveal>
    </Section>
  )
}
