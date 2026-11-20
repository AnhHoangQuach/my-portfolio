import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

/** Retired URLs, per locale prefix ('' = default English, '/ja'). */
function retired(prefix: string) {
  const home = prefix || '/'
  // Case studies now live on the My Khe beach landmark (Projects).
  // `/ja?at=…`, not `/ja/?at=…`: a trailing slash would cost an extra redirect hop.
  const projects = prefix ? `${prefix}?at=projects` : '/?at=projects'
  return [
    { source: `${prefix}/work/:slug*`, destination: projects, permanent: true },
    { source: `${prefix}/projects`, destination: projects, permanent: true },
    { source: `${prefix}/case-studies/:slug*`, destination: projects, permanent: true },
    // The blog was retired; its posts have no replacement page.
    { source: `${prefix}/blog/:slug*`, destination: home, permanent: true },
    { source: `${prefix}/posts/:slug*`, destination: home, permanent: true },
    // The 3D world briefly lived at /world before it became the homepage.
    { source: `${prefix}/world`, destination: home, permanent: true },
  ]
}

const nextConfig: NextConfig = {
  // Rewrites barrel imports to per-module paths, so only what is used ships.
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
  async redirects() {
    return [...retired(''), ...retired('/ja')]
  },
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl(nextConfig)
