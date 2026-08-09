export const siteConfig = {
  name: 'Quach Hoang Anh',
  /** Personal brand / English name. Paired with `name` everywhere Google needs
   *  to learn that the two refer to the same person. */
  alternateName: 'Hayes',
  domain: 'hayes.io.vn',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hayes.io.vn',
  ogImage: '/og-image.png',
  /**
   * Locale-independent fallback, used by the manifest and the Schema.org
   * graph. The per-page meta description comes from the `seo` namespace in
   * `messages/*.json` so it can be translated; keep the two in step.
   */
  description:
    'Senior Software Engineer specializing in Next.js, React, TypeScript, Node.js and Go. Backend services, event-driven architecture and scalable systems — five years shipping cash-handling telemetry, airline ticketing and real-time marketplaces.',
  links: {
    github: 'https://github.com/AnhHoangQuach',
    linkedin: 'https://linkedin.com/in/quach-hoang-anh/',
  },
  /**
   * Google Search Console verification token. Set
   * `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in the deployment environment; the
   * `verification` meta tag is omitted entirely when it is absent, which is
   * correct — an empty token is worse than none.
   */
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
} as const

/** Every social profile that belongs in `sameAs` on the Person schema. */
export const sameAsProfiles = [siteConfig.links.github, siteConfig.links.linkedin]
