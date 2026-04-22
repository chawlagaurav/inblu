'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Percent, MessageSquare, Clock, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface PopupSettings {
  id: string
  popupEnabled: boolean
  popupHeadline: string
  popupSubtext: string
  discountCode: string
  discountPercentage: number
  popupDelay: number
  startDate: string | null
  endDate: string | null
}

export function PopupSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PopupSettings>({
    id: '',
    popupEnabled: true,
    popupHeadline: 'GET 10% OFF YOUR FIRST ORDER',
    popupSubtext: 'Join our community and get exclusive offers on water purification products.',
    discountCode: 'CLEANWATER10',
    discountPercentage: 10,
    popupDelay: 5,
    startDate: null,
    endDate: null,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/marketing/settings?admin=true')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          id: data.id || '',
          popupEnabled: data.popupEnabled ?? true,
          popupHeadline: data.popupHeadline || 'GET 10% OFF YOUR FIRST ORDER',
          popupSubtext: data.popupSubtext || 'Join our community and get exclusive offers on water purification products.',
          discountCode: data.discountCode || 'CLEANWATER10',
          discountPercentage: data.discountPercentage ?? 10,
          popupDelay: data.popupDelay ?? 5,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : null,
        })
      }
    } catch (error) {
      console.error('Error fetching popup settings:', error)
      toast.error('Failed to load popup settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/marketing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          startDate: settings.startDate || null,
          endDate: settings.endDate || null,
        }),
      })

      if (response.ok) {
        toast.success('Popup settings saved successfully')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving popup settings:', error)
      toast.error('Failed to save popup settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = () => {
    setSettings(prev => ({ ...prev, popupEnabled: !prev.popupEnabled }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Discount Popup Settings
        </CardTitle>
        <CardDescription>
          Configure the discount popup that appears to new visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <h4 className="font-medium text-slate-900">Enable Popup</h4>
            <p className="text-sm text-slate-500">Show the discount popup to new visitors</p>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.popupEnabled ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                settings.popupEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
            {settings.popupEnabled ? (
              <ToggleRight className="absolute right-1 h-4 w-4 text-white" />
            ) : (
              <ToggleLeft className="absolute left-1 h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="popup_headline">Headline</Label>
          <Input
            id="popup_headline"
            value={settings.popupHeadline}
            onChange={(e) => setSettings(prev => ({ ...prev, popupHeadline: e.target.value }))}
            placeholder="GET 10% OFF YOUR FIRST ORDER"
          />
        </div>

        {/* Subtext */}
        <div className="space-y-2">
          <Label htmlFor="popup_subtext">Subtext</Label>
          <Textarea
            id="popup_subtext"
            value={settings.popupSubtext}
            onChange={(e) => setSettings(prev => ({ ...prev, popupSubtext: e.target.value }))}
            placeholder="Join our community and get exclusive offers..."
            rows={2}
          />
        </div>

        {/* Discount Code and Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_code">Discount Code</Label>
            <Input
              id="discount_code"
              value={settings.discountCode}
              onChange={(e) => setSettings(prev => ({ ...prev, discountCode: e.target.value.toUpperCase() }))}
              placeholder="CLEANWATER10"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_percentage" className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Discount Percentage
            </Label>
            <Input
              id="discount_percentage"
              type="number"
              min={1}
              max={100}
              value={settings.discountPercentage}
              onChange={(e) => setSettings(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
              placeholder="10"
            />
          </div>
        </div>

        {/* Popup Delay */}
        <div className="space-y-2">
          <Label htmlFor="popup_delay" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Popup Delay (seconds)
          </Label>
          <Input
            id="popup_delay"
            type="number"
            min={1}
            max={60}
            value={settings.popupDelay}
            onChange={(e) => setSettings(prev => ({ ...prev, popupDelay: parseInt(e.target.value) || 5 }))}
            placeholder="5"
          />
          <p className="text-xs text-slate-500">
            Time to wait before showing the popup to new visitors
          </p>
        </div>

        {/* Scheduling */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={settings.startDate || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value || null }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={settings.endDate || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value || null }))}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Leave empty to run the popup indefinitely
          </p>
        </div>

        {/* Preview */}
        {settings.popupEnabled && (
          <div className="p-4 border border-dashed border-blue-300 rounded-xl bg-blue-50">
            <h4 className="font-medium text-slate-900 mb-2">Preview</h4>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">{settings.popupHeadline}</p>
              <p className="text-sm text-slate-600">{settings.popupSubtext}</p>
              <p className="text-sm mt-2">
                <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 text-blue-600">
                  {settings.discountCode}
                </span>
                <span className="text-slate-500 ml-2">→ {settings.discountPercentage}% off</span>
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
