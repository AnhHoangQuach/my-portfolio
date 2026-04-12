export interface Profile {
  name: string
  firstName: string
  lastName: string
  role: string
  tagline: string
  bio: string
  email: string
  location: string
  avatarUrl?: string
  resumeUrl: string
  yearsOfExperience: number
  projectCount: number
  certificationCount: number
  languageProficiency: string
}

export interface SocialLink {
  name: string
  url: string
  icon: string
}

export interface Skill {
  name: string
  highlighted?: boolean
}

export interface SkillGroup {
  title: string
  icon: string
  skills: Skill[]
}

export interface Experience {
  company: string
  role: string
  duration: string
  startYear: number
  endYear: number | 'Present'
  description: string
  achievements: string[]
  techStack: string[]
}

export interface Project {
  title: string
  subtitle: string
  description: string
  imageUrl: string
  techStack: string[]
  liveUrl?: string
  githubUrl?: string
  caseStudyUrl?: string
}

export interface Certification {
  title: string
  subtitle: string
  icon: string
}

export interface NavItem {
  label: string
  href: string
}
