'use client'

import { Monitor, Terminal, Cloud, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Section, SectionHeader } from '@/components/section'
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/motion'
import { skillGroups } from '@/data/skills'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const iconMap: Record<string, React.ElementType> = {
  monitor: Monitor,
  terminal: Terminal,
  cloud: Cloud,
  database: Database,
}

const gridSpan: Record<number, string> = {
  0: 'md:col-span-7',
  1: 'md:col-span-5',
  2: 'md:col-span-5',
  3: 'md:col-span-7',
}

export function SkillsSection() {
  const t = useTranslations('skills')

  return (
    <Section id="tech">
      <FadeIn>
        <SectionHeader title={t('title')} description={t('description')} />
      </FadeIn>

      <FadeInStagger className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {skillGroups.map((group, i) => {
          const Icon = iconMap[group.icon]
          return (
            <FadeInStaggerItem key={group.title} className={cn('col-span-1', gridSpan[i])}>
              <Card className="h-full border-border/40 bg-background/50 backdrop-blur-sm transition-colors hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    {Icon && <Icon className="h-6 w-6 text-primary" />}
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <Badge
                        key={skill.name}
                        variant={skill.highlighted ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeInStaggerItem>
          )
        })}
      </FadeInStagger>
    </Section>
  )
}
