/**
 * Pass-through root layout — `<html>` and `<body>` live in
 * `app/[locale]/layout.tsx` (and in `app/not-found.tsx`, which renders outside
 * any locale segment).
 *
 * This used to render the document shell and resolve the locale with
 * `getLocale()`. That call reads request headers, which opted the entire route
 * tree out of static rendering: every page was server-rendered on demand. With
 * the shell moved under `[locale]`, the locale arrives as a route param and
 * every page prerenders at build time.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
