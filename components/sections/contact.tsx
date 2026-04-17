'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Send, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Section } from '@/components/section'
import { FadeIn } from '@/components/motion'
import { profile } from '@/data/profile'
import { useTranslations } from 'next-intl'

export function ContactSection() {
  const t = useTranslations('contact')
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formState.name.trim()) errs.name = t('errorName')
    if (!formState.email.trim()) errs.email = t('errorEmail')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email))
      errs.email = t('errorEmailInvalid')
    if (!formState.message.trim()) errs.message = t('errorMessage')
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      // For now, open mailto
      const subject = encodeURIComponent(`Portfolio Contact from ${formState.name}`)
      const body = encodeURIComponent(formState.message)
      window.open(`mailto:${profile.email}?subject=${subject}&body=${body}`, '_blank')
    }
  }

  return (
    <Section id="contact" className="relative overflow-hidden">
      {/* Background accent */}
      <div className="pointer-events-none absolute right-0 top-0 h-125 w-125 rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative grid gap-16 lg:grid-cols-2">
        {/* Left - CTA */}
        <FadeIn>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t('title')} <span className="text-primary">{t('titleHighlight')}</span> {t('titleEnd')}
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            {t('description')}
          </p>

          <div className="mt-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('emailMe')}
                </div>
                <Link
                  href={`mailto:${profile.email}`}
                  className="text-base transition-colors hover:text-primary"
                >
                  {profile.email}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('location')}
                </div>
                <div className="text-base">{profile.location}</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Right - Form */}
        <FadeIn transition={{ delay: 0.2 }}>
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('name')}
                    </label>
                    <Input
                      id="name"
                      placeholder={t('namePlaceholder')}
                      value={formState.name}
                      onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('email')}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={formState.email}
                      onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t('message')}
                  </label>
                  <Textarea
                    id="message"
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message}</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full">
                  {t('send')}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </Section>
  )
}
