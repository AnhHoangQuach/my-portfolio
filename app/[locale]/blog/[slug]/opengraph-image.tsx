import { getBlogPost, getBlogPosts } from '@/lib/content'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og-image'
import { siteConfig } from '@/lib/site-config'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Article preview'

// Without this the card is generated per request; the set of posts is known at
// build time, so bake them.
export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }))
}

/**
 * Per-post share card. The site-wide og-image.png stays as the fallback for
 * routes that have no title of their own; a post shared into Slack or LinkedIn
 * now shows its own headline instead.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)

  return renderOgImage({
    eyebrow: 'Engineering Notes',
    title: post?.meta.title ?? siteConfig.name,
    tags: post?.meta.tags,
  })
}
