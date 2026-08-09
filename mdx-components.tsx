import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    /**
     * Demoted to `h2`. Every MDX file opens with a `# Title` that repeats the
     * title the page already renders as its `h1`, so each article was shipping
     * two competing `h1`s. Keeping the h1 type scale means the change is
     * invisible; only the document outline moves.
     */
    h1: ({ children }) => (
      <h2 className="mt-8 mb-4 text-4xl font-bold tracking-tight">{children}</h2>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 mb-3 text-2xl font-bold tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="mt-6 mb-2 text-xl font-semibold">{children}</h3>,
    p: ({ children }) => <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    /**
     * MDX gives no intrinsic dimensions, so the 16:9 box below is what
     * reserves layout space — a raw `<img>` collapsed to zero height until it
     * decoded, which is a guaranteed CLS hit mid-article. `next/image` also
     * gets us AVIF/WebP and lazy loading; article images are never the LCP
     * element, so none of them are prioritised.
     */
    img: ({ src, alt, title }) =>
      src ? (
        <figure className="my-6">
          <Image
            src={src}
            alt={alt || ''}
            width={1200}
            height={675}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full rounded-lg border border-border"
          />
          {title && (
            <figcaption className="mt-2 text-center text-sm text-faint">{title}</figcaption>
          )}
        </figure>
      ) : null,
    hr: () => <hr className="my-8 border-border" />,
    ...components,
  }
}
