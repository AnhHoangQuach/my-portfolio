export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  readingTime: number
  published: boolean
  image?: string
}

export interface CaseStudy {
  slug: string
  title: string
  subtitle: string
  description: string
  date: string
  techStack: string[]
  image?: string
  liveUrl?: string
  githubUrl?: string
  published: boolean
}
