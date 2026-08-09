import type {
  Article,
  BreadcrumbList,
  Person,
  ProfilePage,
  WithContext,
  WebSite,
  CreativeWork,
  ItemList,
} from 'schema-dts'

import { siteConfig, sameAsProfiles } from './site-config'
import { profile } from '@/data/profile'
import { localeUrl } from './metadata'

/**
 * Stable @ids so the graph nodes can reference each other instead of repeating
 * the Person object on every page. Google follows these.
 */
export const SCHEMA_ID = {
  person: `${siteConfig.url}/#person`,
  website: `${siteConfig.url}/#website`,
} as const

/**
 * Everything Google needs to resolve
 * "Quach Hoang Anh" = "Hayes" = Senior Software Engineer into one entity.
 * `alternateName` is what ties the personal brand to the legal name; `sameAs`
 * is what corroborates it against GitHub and LinkedIn.
 */
export function personSchema(): WithContext<Person> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': SCHEMA_ID.person,
    name: profile.name,
    alternateName: siteConfig.alternateName,
    givenName: profile.firstName,
    familyName: profile.lastName,
    jobTitle: profile.role,
    description: profile.bio,
    url: siteConfig.url,
    image: `${siteConfig.url}/icon-512.png`,
    email: `mailto:${profile.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Da Nang',
      addressCountry: 'VN',
    },
    nationality: { '@type': 'Country', name: 'Vietnam' },
    sameAs: sameAsProfiles,
    knowsAbout: [
      'Software Engineering',
      'Software Architecture',
      'System Design',
      'Next.js',
      'React',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'NestJS',
      'Go',
      'Backend Development',
      'REST API Design',
      'GraphQL',
      'Microservices',
      'Distributed Systems',
      'Event-Driven Architecture',
      'Apache Kafka',
      'PostgreSQL',
      'Redis',
      'MongoDB',
      'Docker',
      'Kubernetes',
      'AWS',
      'CI/CD',
      'DevOps',
      'Performance Optimization',
    ],
    knowsLanguage: [
      { '@type': 'Language', name: 'Vietnamese' },
      { '@type': 'Language', name: 'English' },
      { '@type': 'Language', name: 'Japanese' },
    ],
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Hanoi University of Science and Technology',
      alternateName: 'HUST',
    },
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Senior Software Engineer',
      occupationalCategory: '15-1252.00',
      skills: 'Next.js, React, TypeScript, Node.js, NestJS, Go, Kafka, PostgreSQL, Kubernetes, AWS',
    },
  }
}

export function websiteSchema(locale: string): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SCHEMA_ID.website,
    name: `${profile.name} (${siteConfig.alternateName}) — ${profile.role}`,
    alternateName: siteConfig.domain,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: locale,
    publisher: { '@id': SCHEMA_ID.person },
    author: { '@id': SCHEMA_ID.person },
    copyrightHolder: { '@id': SCHEMA_ID.person },
  }
}

/**
 * The homepage is a profile page about a person — the type Google uses to
 * surface an author/creator panel. `mainEntity` points at the Person node.
 */
export function profilePageSchema(locale: string): WithContext<ProfilePage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: localeUrl(locale),
    name: `${profile.name} (${siteConfig.alternateName}) — ${profile.role}`,
    description: siteConfig.description,
    inLanguage: locale,
    isPartOf: { '@id': SCHEMA_ID.website },
    mainEntity: { '@id': SCHEMA_ID.person },
    about: { '@id': SCHEMA_ID.person },
  }
}

/** @param trail ordered crumbs; paths are locale-relative, e.g. '/work'. */
export function breadcrumbSchema(
  locale: string,
  trail: Array<{ name: string; path: string }>,
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: localeUrl(locale, crumb.path),
    })),
  }
}

export function articleSchema(input: {
  locale: string
  path: string
  headline: string
  description: string
  datePublished: string
  dateModified?: string
  keywords?: string[]
  image?: string
}): WithContext<Article> {
  const url = localeUrl(input.locale, input.path)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: input.locale,
    author: { '@id': SCHEMA_ID.person },
    publisher: { '@id': SCHEMA_ID.person },
    isPartOf: { '@id': SCHEMA_ID.website },
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
    image: `${siteConfig.url}${input.image ?? siteConfig.ogImage}`,
  }
}

/** A shipped system, described as work authored by the Person. */
export function projectSchema(input: {
  locale: string
  path: string
  name: string
  description: string
  techStack: string[]
  image?: string
}): WithContext<CreativeWork> {
  const url = localeUrl(input.locale, input.path)

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: input.locale,
    creator: { '@id': SCHEMA_ID.person },
    author: { '@id': SCHEMA_ID.person },
    keywords: input.techStack.join(', '),
    image: `${siteConfig.url}${input.image ?? siteConfig.ogImage}`,
  }
}

/** Ordered index of items on a listing page (work index, blog index). */
export function itemListSchema(
  locale: string,
  items: Array<{ name: string; path: string }>,
): WithContext<ItemList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: localeUrl(locale, item.path),
    })),
  }
}
