export interface Profile {
  name: string
  firstName: string
  lastName: string
  role: string
  /** Hero headline — the one-line thesis of the site. */
  headline: string
  tagline: string
  bio: string
  email: string
  location: string
  avatarUrl?: string
  resumeUrl: string
  yearsOfExperience: number
  companyCount: number
  certificationCount: number
  languageProficiency: string
  /** Rendered in the footer strip, e.g. "HUST, Software Engineering". */
  education: string
  /** Rendered next to `education`, e.g. "Professional Scrum Master I · JLPT N3". */
  credentials: string
}

/** One line of the animated hero terminal. */
export interface TerminalLine {
  /** Shell prompt; empty string marks an output (non-typed-prompt) line. */
  prompt: string
  text: string
  /** Which text tier the line renders in. */
  tone: 'command' | 'output' | 'accent' | 'violet'
}

/** A stat printed under the hero pipeline diagram. */
export interface Stat {
  value: string
  label: string
}

export interface Experience {
  company: string
  role: string
  period: string
  /** One-line framing of what the company/product was. */
  note: string
  points: string[]
  techStack: string[]
}

/** A box in a case-study architecture flow. */
export interface ArchitectureNode {
  name: string
  sub: string
}

export interface Project {
  /** URL segment under /work — the project's own indexable page. */
  slug: string
  /** Uppercase kicker, e.g. "GLORY SOFTWARE · CASH HANDLING". */
  tag: string
  title: string
  /** Mono meta line, e.g. "NestJS · Kafka · MQTT · PostgreSQL". */
  meta: string
  /** ~155 chars, used verbatim as the project page's meta description. */
  summary: string
  /** Employer the work was done for; matches `Experience.company`. */
  company: string
  /** Title held on this project; matches the corresponding `Experience.role`. */
  role: string
  period: string
  problem: string
  solution: string
  nodes: ArchitectureNode[]
  techStack: string[]
  impact: Stat[]
  liveUrl?: string
  githubUrl?: string
}

export interface ExpertiseArea {
  /** Two-digit index, e.g. "01". */
  n: string
  /** Key into the icon map in components/sections/expertise.tsx. */
  icon: 'backend' | 'frontend' | 'data' | 'cloud' | 'architecture' | 'testing'
  title: string
  note: string
  items: string[]
}

export interface PracticeItem {
  kicker: string
  title: string
  body: string
}

export interface Principle {
  n: string
  title: string
  body: string
}

/** Translation key under the `nav` namespace. */
export type NavLabelKey =
  | 'about'
  | 'experience'
  | 'work'
  | 'expertise'
  | 'practice'
  | 'blog'
  | 'contact'
  | 'resume'
  | 'menu'
  | 'openMenu'

export interface NavItem {
  label: NavLabelKey
  href: string
  /** Section id used for scroll-spy; absent for links that leave the page. */
  sectionId?: string
}
