import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { JsonLd } from '@/components/json-ld'
import { WorldPanels } from '@/components/world/panels'
import type { WorldStrings } from '@/components/world/strings'
import { WorldExperience } from '@/components/world/world-experience'
import { profile } from '@/data/profile'
import { buildPageMetadata } from '@/lib/metadata'
import { personSchema, profilePageSchema, websiteSchema } from '@/lib/schema'
import { LANDMARKS, LANDMARK_ORDER, type LandmarkId } from '@/lib/world/landmarks'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  return buildPageMetadata({
    locale,
    // `absoluteTitle` bypasses the `%s | Quach Hoang Anh (Hayes)` template —
    // the homepage title already carries both names.
    absoluteTitle: t('homeTitle'),
    description: t('siteDescription'),
    type: 'profile',
  })
}

/** Translation key under `world.landmarks` for each landmark id. */
const LANDMARK_KEYS: Record<LandmarkId, string> = {
  'dragon-bridge': 'dragonBridge',
  'city-center': 'cityCenter',
  'son-tra': 'sonTra',
  'my-khe': 'myKhe',
  'marble-mountains': 'marbleMountains',
  'love-bridge': 'loveBridge',
}

/**
 * The homepage is the 3D world, Da Nang DevQuest. Strings are resolved here
 * and handed to the client as props; panel bodies are Server Components.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'world' })
  const hero = await getTranslations({ locale, namespace: 'hero' })

  const strings: WorldStrings = {
    kicker: t('kicker'),
    identity: {
      name: profile.name,
      initials: t('initials'),
      role: profile.role,
      location: t('location'),
    },
    loading: {
      title: t('loading.title'),
      stages: [0, 1, 2, 3, 4].map((i) => t(`loading.stage${i}`)),
    },
    intro: {
      title: t('intro.title'),
      subtitle: t('intro.subtitle'),
      explore: t('intro.explore'),
      skip: t('intro.skip'),
    },
    hud: {
      menu: t('hud.menu'),
      closeMenu: t('hud.closeMenu'),
      overview: t('hud.overview'),
      hint: t('hud.hint'),
      journey: t('hud.journey'),
      switchLocale: t('hud.switchLocale'),
      localeLabel: t('hud.localeLabel'),
    },
    panel: {
      back: t('panel.back'),
      next: t('panel.next'),
      previous: t('panel.previous'),
      stop: t('panel.stop'),
    },
    fallback: {
      title: t('fallback.title'),
      body: t('fallback.body'),
      cta: t('fallback.cta'),
    },
    landmarks: Object.fromEntries(
      Object.entries(LANDMARK_KEYS).map(([id, key]) => [
        id,
        {
          name: t(`landmarks.${key}.name`),
          section: t(`landmarks.${key}.section`),
          blurb: t(`landmarks.${key}.blurb`),
        },
      ]),
    ) as WorldStrings['landmarks'],
  }

  const panels = WorldPanels()

  return (
    <>
      {/* Person + WebSite + ProfilePage, cross-linked by @id, so search
          engines resolve "Quach Hoang Anh", "Hayes" and the social profiles
          into a single entity. */}
      <JsonLd schema={[personSchema(), websiteSchema(locale), profilePageSchema(locale)]} />

      <WorldExperience strings={strings} panels={panels} locale={locale} />

      {/* Text version of the whole world. The canvas carries no readable
          text, so this is what screen readers and crawlers get: one h1 and
          every section's content, in journey order. It sits after the world in
          the DOM so keyboard focus reaches the visible HUD first. */}
      <main id="world-text" tabIndex={-1} className="sr-only">
        <h1>
          {hero('eyebrow')}. {hero('headline')}
        </h1>
        {LANDMARK_ORDER.map((id) => (
          <section key={id} aria-label={strings.landmarks[id].section}>
            <h2>
              {strings.landmarks[id].section} — {strings.landmarks[id].name}
            </h2>
            {panels[LANDMARKS[id].section]}
          </section>
        ))}
      </main>
    </>
  )
}
