import Script from 'next/script'
import { siteConfig } from '@/lib/site-config'
import { profile } from '@/data/profile'

export function JsonLd() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: siteConfig.url,
    email: profile.email,
    jobTitle: profile.role,
    description: profile.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ho Chi Minh City',
      addressCountry: 'VN',
    },
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin, siteConfig.links.twitter],
    knowsAbout: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'NestJS',
      'Golang',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'Kafka',
      'Docker',
      'Kubernetes',
      'AWS',
      'Microservices',
      'Distributed Systems',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${profile.name} — Portfolio`,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      '@type': 'Person',
      name: profile.name,
    },
  }

  return (
    <>
      <Script
        id="person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema).replace(/</g, '\\u003c'),
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c'),
        }}
      />
    </>
  )
}
