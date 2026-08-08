import { NavItem } from '@/types'

/**
 * `sectionId` drives the scroll-spy underline in the navbar. Items without one
 * (Blog) navigate away from the one-pager and never light up.
 */
export const navItems: NavItem[] = [
  { label: 'about', href: '#about', sectionId: 'about' },
  { label: 'experience', href: '#experience', sectionId: 'experience' },
  { label: 'work', href: '#work', sectionId: 'work' },
  { label: 'expertise', href: '#expertise', sectionId: 'expertise' },
  { label: 'practice', href: '#practice', sectionId: 'practice' },
  { label: 'blog', href: '/blog' },
]
