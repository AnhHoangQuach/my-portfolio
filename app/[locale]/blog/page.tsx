import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from '@/lib/content'
import { Section, SectionHeader } from '@/components/section'
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Clock } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Articles about web development, software engineering, React, Next.js, TypeScript, and more.',
}

export default function BlogPage() {
  const posts = getBlogPosts()

  return (
    <>
      <Navbar />
      <main>
        <Section id="blog" className="pt-32">
          <SectionHeader
            title="Blog"
            description="Thoughts on web development, software engineering, and technology."
          />
          <FadeInStagger>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <FadeInStaggerItem key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="group h-full transition-colors hover:border-primary/50">
                      <CardContent className="flex h-full flex-col gap-4 p-6">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {new Date(post.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.readingTime} min read
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        <p className="flex-1 text-muted-foreground">{post.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </FadeInStaggerItem>
              ))}
              {posts.length === 0 && (
                <FadeIn>
                  <p className="col-span-full text-center text-muted-foreground">
                    No posts yet. Check back soon!
                  </p>
                </FadeIn>
              )}
            </div>
          </FadeInStagger>
        </Section>
      </main>
      <Footer />
    </>
  )
}
