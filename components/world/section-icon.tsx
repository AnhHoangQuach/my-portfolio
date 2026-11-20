import { Building2, Heart, House, Mountain, TreePalm, TreePine } from 'lucide-react'

import type { SectionId } from '@/lib/world/landmarks'

const ICONS = {
  home: House,
  about: Building2,
  skills: TreePine,
  projects: TreePalm,
  experience: Mountain,
  contact: Heart,
} satisfies Record<SectionId, unknown>

export function SectionIcon({ section, className }: { section: SectionId; className?: string }) {
  const Icon = ICONS[section]
  return <Icon className={className} aria-hidden />
}
