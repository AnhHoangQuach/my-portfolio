import type { Thing, WithContext } from 'schema-dts'

/**
 * Renders one or more Schema.org graphs as `application/ld+json`.
 *
 * `<` is escaped because a stray `</script>` inside any string field — a blog
 * title, a project description — would otherwise close the tag early and
 * inject the remainder as markup.
 */
export function JsonLd({ schema }: { schema: WithContext<Thing> | Array<WithContext<Thing>> }) {
  const graphs = Array.isArray(schema) ? schema : [schema]

  return (
    <>
      {graphs.map((graph, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(graph).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  )
}
