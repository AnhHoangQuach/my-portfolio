import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    // AVIF first, WebP as the fallback — both far smaller than the PNG
    // originals, and the optimizer picks per request from the Accept header.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  // Barrel-file imports pull the whole icon set into the module graph before
  // tree-shaking; this rewrites them to per-icon paths at build time.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      // The one-pager's project anchor moved from #projects to #work when the
      // sections were renamed; the old hash still appears in older links and
      // in anything Google has cached.
      { source: '/projects', destination: '/work', permanent: true },
      { source: '/case-studies', destination: '/work', permanent: true },
      { source: '/case-studies/:slug', destination: '/work/:slug', permanent: true },
      { source: '/posts/:slug', destination: '/blog/:slug', permanent: true },
    ]
  },
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const withMDX = createMDX({})

export default withNextIntl(withMDX(nextConfig))
