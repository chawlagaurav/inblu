'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Megaphone, Check, X, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface BannerState {
  active: boolean
  text: string
  link: string
}

// Three MarketingContent keys, one form. Persist them together via /api/admin/marketing
// so a single Save click writes all three.
export function PromoBannerForm() {
  const [state, setState] = useState<BannerState>({ active: false, text: '', link: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/marketing')
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { key: string; content: string | null }[]) => {
        const map = Object.fromEntries(rows.map((r) => [r.key, r.content ?? '']))
        setState({
          active: map['promo_banner_active'] === 'true',
          text: map['promo_banner_text'] || '',
          link: map['promo_banner_link'] || '',
        })
      })
      .catch((err) => {
        console.error('Failed to load promo banner:', err)
        toast.error('Failed to load promo banner settings')
      })
      .finally(() => setLoading(false))
  }, [])

  const saveKey = async (key: string, content: string) => {
    const res = await fetch('/api/admin/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, content, isActive: true }),
    })
    if (!res.ok) throw new Error(`Failed to save ${key}`)
  }

  const handleSave = async () => {
    if (state.active && !state.text.trim()) {
      toast.error('Banner text is required when enabled')
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        saveKey('promo_banner_active', state.active ? 'true' : 'false'),
        saveKey('promo_banner_text', state.text.trim()),
        saveKey('promo_banner_link', state.link.trim()),
      ])
      toast.success('Promo banner saved')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save promo banner')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = () => setState((prev) => ({ ...prev, active: !prev.active }))

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              Promo Banner
            </CardTitle>
            <CardDescription>
              Thin blue bar at the very top of the site (above the header). Dismissible per session.
            </CardDescription>
          </div>
          {/* Toggle — same look as the popup settings toggle */}
          <button
            type="button"
            onClick={toggleActive}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors ${
              state.active ? 'bg-blue-500' : 'bg-slate-300'
            }`}
            aria-pressed={state.active}
            aria-label="Toggle promo banner"
          >
            <span
              className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md transition-transform mt-1 ${
                state.active ? 'translate-x-7' : 'translate-x-1'
              }`}
            >
              {state.active ? (
                <Check className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-slate-400" />
              )}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="promo_banner_text">Banner Text</Label>
          <Input
            id="promo_banner_text"
            value={state.text}
            onChange={(e) => setState((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Free shipping on orders over $100!"
            maxLength={120}
          />
          <p className="text-xs text-slate-500">{state.text.length}/120 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo_banner_link">Link (optional)</Label>
          <Input
            id="promo_banner_link"
            value={state.link}
            onChange={(e) => setState((prev) => ({ ...prev, link: e.target.value }))}
            placeholder="/products"
          />
          <p className="text-xs text-slate-500">
            If set, a &ldquo;Shop Now&rdquo; link appears next to the banner text.
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          {state.active && state.text.trim() ? (
            <div className="rounded-lg overflow-hidden border">
              <div className="relative bg-blue-600 text-white text-sm">
                <div className="max-w-7xl mx-auto pl-4 pr-10 py-2 flex items-center justify-center gap-2">
                  <span className="text-center font-medium truncate">{state.text}</span>
                  {state.link.trim() && (
                    <span className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 whitespace-nowrap">
                      Shop Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5">
                    <X className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-4 text-center text-sm text-slate-400">
              {state.active ? 'Add banner text to see preview' : 'Banner is disabled'}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Banner
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
