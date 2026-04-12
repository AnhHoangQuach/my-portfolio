import { MDXRemote as MDXRemoteBase } from 'next-mdx-remote/rsc'
import { useMDXComponents } from '@/mdx-components'

export function MDXRemote({ source }: { source: string }) {
  const components = useMDXComponents({})
  return <MDXRemoteBase source={source} components={components} />
}
