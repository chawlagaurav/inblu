'use client'

import { useState, useEffect } from 'react'
import { Save, ImageIcon, Type, Link2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { PopupSettingsForm } from '@/components/admin/popup-settings-form'

interface MarketingContent {
  id: string
  key: string
  content: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const defaultContent = {
  hero_heading: 'Premium Outdoor Gear for Your Next Adventure',
  hero_subheading: 'Discover our collection of high-quality outdoor equipment designed for explorers.',
  hero_cta_primary_text: 'Shop Now',
  hero_cta_primary_link: '/products',
  hero_cta_secondary_text: 'Learn More',
  hero_cta_secondary_link: '/about',
  hero_background_image: '/images/hero-bg.jpg',
  promo_banner_text: 'Free shipping on orders over $100!',
  promo_banner_link: '/products',
  promo_banner_active: 'true',
}

export default function AdminMarketingPage() {
  const [, setContent] = useState<Record<string, MarketingContent>>({})
  const [formData, setFormData] = useState<Record<string, string>>(defaultContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/marketing')
      if (response.ok) {
        const data = await response.json()
        const contentMap: Record<string, MarketingContent> = {}
        const formDataMap: Record<string, string> = { ...defaultContent }
        
        data.forEach((item: MarketingContent) => {
          contentMap[item.key] = item
          formDataMap[item.key] = item.content || ''
        })
        
        setContent(contentMap)
        setFormData(formDataMap)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load marketing content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      const response = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          content: formData[key],
          isActive: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setContent(prev => ({ ...prev, [key]: data }))
        toast.success('Content saved successfully')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
    } finally {
      setSaving(null)
    }
  }

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketing Content</h1>
          <p className="text-slate-500 mt-1">Manage homepage content and promotions</p>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-6">
        {/* Discount Popup Settings */}
        <StaggerItem>
          <PopupSettingsForm />
        </StaggerItem>

        {/* Hero Section */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Hero Section
              </CardTitle>
              <CardDescription>Customize the main hero section on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Heading */}
              <div className="space-y-2">
                <Label htmlFor="hero_heading">Heading</Label>
                <div className="flex gap-2">
                  <Input
                    id="hero_heading"
                    value={formData.hero_heading || ''}
                    onChange={(e) => handleChange('hero_heading', e.target.value)}
                    placeholder="Enter hero heading..."
                  />
                  <Button 
                    onClick={() => handleSave('hero_heading')}
                    disabled={saving === 'hero_heading'}
                    size="sm"
                  >
                    {saving === 'hero_heading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Hero Subheading */}
              <div className="space-y-2">
                <Label htmlFor="hero_subheading">Subheading</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="hero_subheading"
                    value={formData.hero_subheading || ''}
                    onChange={(e) => handleChange('hero_subheading', e.target.value)}
                    placeholder="Enter hero subheading..."
                    rows={2}
                  />
                  <Button 
                    onClick={() => handleSave('hero_subheading')}
                    disabled={saving === 'hero_subheading'}
                    size="sm"
                    className="self-start"
                  >
                    {saving === 'hero_subheading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Hero Background Image */}
              <div className="space-y-2">
                <Label htmlFor="hero_background_image">Background Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="hero_background_image"
                    value={formData.hero_background_image || ''}
                    onChange={(e) => handleChange('hero_background_image', e.target.value)}
                    placeholder="/images/hero-bg.jpg"
                  />
                  <Button 
                    onClick={() => handleSave('hero_background_image')}
                    disabled={saving === 'hero_background_image'}
                    size="sm"
                  >
                    {saving === 'hero_background_image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Upload images to /public/images/ or use external URLs</p>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900">Primary CTA</h4>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_primary_text">Button Text</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_primary_text"
                        value={formData.hero_cta_primary_text || ''}
                        onChange={(e) => handleChange('hero_cta_primary_text', e.target.value)}
                        placeholder="Shop Now"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_primary_text')}
                        disabled={saving === 'hero_cta_primary_text'}
                        size="sm"
                      >
                        {saving === 'hero_cta_primary_text' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_primary_link">Button Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_primary_link"
                        value={formData.hero_cta_primary_link || ''}
                        onChange={(e) => handleChange('hero_cta_primary_link', e.target.value)}
                        placeholder="/products"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_primary_link')}
                        disabled={saving === 'hero_cta_primary_link'}
                        size="sm"
                      >
                        {saving === 'hero_cta_primary_link' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900">Secondary CTA</h4>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_secondary_text">Button Text</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_secondary_text"
                        value={formData.hero_cta_secondary_text || ''}
                        onChange={(e) => handleChange('hero_cta_secondary_text', e.target.value)}
                        placeholder="Learn More"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_secondary_text')}
                        disabled={saving === 'hero_cta_secondary_text'}
                        size="sm"
                      >
                        {saving === 'hero_cta_secondary_text' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_secondary_link">Button Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_secondary_link"
                        value={formData.hero_cta_secondary_link || ''}
                        onChange={(e) => handleChange('hero_cta_secondary_link', e.target.value)}
                        placeholder="/about"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_secondary_link')}
                        disabled={saving === 'hero_cta_secondary_link'}
                        size="sm"
                      >
                        {saving === 'hero_cta_secondary_link' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Promotional Banner */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-600" />
                Promotional Banner
              </CardTitle>
              <CardDescription>Configure the top promotional banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={formData.promo_banner_active === 'true' ? 'default' : 'secondary'}>
                  {formData.promo_banner_active === 'true' ? (
                    <><Eye className="h-3 w-3 mr-1" /> Active</>
                  ) : (
                    <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                  )}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newValue = formData.promo_banner_active === 'true' ? 'false' : 'true'
                    handleChange('promo_banner_active', newValue)
                    handleSave('promo_banner_active')
                  }}
                  disabled={saving === 'promo_banner_active'}
                >
                  {formData.promo_banner_active === 'true' ? 'Hide Banner' : 'Show Banner'}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_banner_text">Banner Text</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo_banner_text"
                    value={formData.promo_banner_text || ''}
                    onChange={(e) => handleChange('promo_banner_text', e.target.value)}
                    placeholder="Free shipping on orders over $100!"
                  />
                  <Button 
                    onClick={() => handleSave('promo_banner_text')}
                    disabled={saving === 'promo_banner_text'}
                    size="sm"
                  >
                    {saving === 'promo_banner_text' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_banner_link">Banner Link (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo_banner_link"
                    value={formData.promo_banner_link || ''}
                    onChange={(e) => handleChange('promo_banner_link', e.target.value)}
                    placeholder="/products"
                  />
                  <Button 
                    onClick={() => handleSave('promo_banner_link')}
                    disabled={saving === 'promo_banner_link'}
                    size="sm"
                  >
                    {saving === 'promo_banner_link' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {formData.promo_banner_active === 'true' && formData.promo_banner_text && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm">
                    {formData.promo_banner_text}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Additional Sections */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                Featured Categories
              </CardTitle>
              <CardDescription>Customize category section titles and descriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categories_heading">Section Heading</Label>
                <div className="flex gap-2">
                  <Input
                    id="categories_heading"
                    value={formData.categories_heading || 'Shop by Category'}
                    onChange={(e) => handleChange('categories_heading', e.target.value)}
                    placeholder="Shop by Category"
                  />
                  <Button 
                    onClick={() => handleSave('categories_heading')}
                    disabled={saving === 'categories_heading'}
                    size="sm"
                  >
                    {saving === 'categories_heading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bestsellers_heading">Best Sellers Heading</Label>
                <div className="flex gap-2">
                  <Input
                    id="bestsellers_heading"
                    value={formData.bestsellers_heading || 'Best Sellers'}
                    onChange={(e) => handleChange('bestsellers_heading', e.target.value)}
                    placeholder="Best Sellers"
                  />
                  <Button 
                    onClick={() => handleSave('bestsellers_heading')}
                    disabled={saving === 'bestsellers_heading'}
                    size="sm"
                  >
                    {saving === 'bestsellers_heading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
