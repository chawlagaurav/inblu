'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Save, ImageIcon, Loader2, Mail, Upload, X, Eye, Video, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { PopupSettingsForm } from '@/components/admin/popup-settings-form'
import { PromoBannerForm } from '@/components/admin/promo-banner-form'

interface MarketingContent {
  id: string
  key: string
  content: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const defaultContent = {
  hero_heading: 'DEFINING\nPURITY.',
  hero_description: 'Advanced RO purifiers & water ionisers engineered for Australian homes. Crystal-clear water, delivered to your doorstep.',
  hero_cta_text: 'Shop Now',
  hero_cta_link: '/products',
  hero_background_image: '/hero-bg.png',
  hero_video_url: '',
}

export default function AdminMarketingPage() {
  const [, setContent] = useState<Record<string, MarketingContent>>({})
  const [formData, setFormData] = useState<Record<string, string>>(defaultContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

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
          if (item.content) {
            formDataMap[item.key] = item.content
          }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'hero')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const imageUrl = data.url

      // Update form data and save
      handleChange('hero_background_image', imageUrl)
      
      // Save to database
      const saveResponse = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_background_image',
          content: imageUrl,
          isActive: true,
        }),
      })

      if (saveResponse.ok) {
        toast.success('Background image updated successfully')
      } else {
        throw new Error('Failed to save image URL')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type — match server allow-list
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Please upload an MP4 or WebM video')
      return
    }

    // Validate size — server allows 15MB, mirror here for a friendlier error.
    // If you have an uncompressed file, compress it with ffmpeg first:
    //   ffmpeg -i in.mp4 -vf scale=1920:-2 -c:v libx264 -crf 28 -preset slow -an -movflags +faststart out.mp4
    if (file.size > 15 * 1024 * 1024) {
      toast.error(
        `Video is ${(file.size / 1024 / 1024).toFixed(1)}MB — max 15MB. Please compress before uploading.`
      )
      return
    }

    setUploadingVideo(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'hero')
      formDataUpload.append('type', 'video')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      const data = await response.json()
      const videoUrl = data.url

      handleChange('hero_video_url', videoUrl)

      const saveResponse = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_video_url',
          content: videoUrl,
          isActive: true,
        }),
      })

      if (saveResponse.ok) {
        toast.success('Hero video updated successfully')
      } else {
        throw new Error('Failed to save video URL')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload video')
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveVideo = async () => {
    handleChange('hero_video_url', '')
    try {
      const response = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_video_url',
          content: '',
          isActive: true,
        }),
      })
      if (response.ok) {
        toast.success('Hero video removed — falling back to background image')
      } else {
        throw new Error('Failed to remove video')
      }
    } catch (error) {
      console.error('Error removing video:', error)
      toast.error('Failed to remove video')
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marketing Content</h1>
            <p className="text-slate-500 mt-1">Manage homepage content and promotions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/" target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Preview Site
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin05/marketing/newsletter">
                <Mail className="h-4 w-4 mr-2" />
                Newsletter
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-6">
        {/* Promo Banner (top of site) */}
        <StaggerItem>
          <PromoBannerForm />
        </StaggerItem>

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
              {/* Hero Background Image Upload */}
              <div className="space-y-3">
                <Label>Background Image</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Current Image Preview */}
                  <div className="relative w-full sm:w-64 h-40 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200">
                    {formData.hero_background_image ? (
                      <>
                        <Image
                          src={formData.hero_background_image}
                          alt="Hero background"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white truncate">
                            {formData.hero_background_image}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full sm:w-auto"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Image
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Recommended: 1920x1080px or larger. Max file size: 5MB.
                    </p>
                    
                    {/* Or enter URL manually */}
                    <div className="pt-2 border-t">
                      <Label htmlFor="hero_background_image" className="text-xs text-slate-500">Or enter image URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="hero_background_image"
                          value={formData.hero_background_image || ''}
                          onChange={(e) => handleChange('hero_background_image', e.target.value)}
                          placeholder="/hero-bg.png"
                          className="text-sm"
                        />
                        <Button 
                          onClick={() => handleSave('hero_background_image')}
                          disabled={saving === 'hero_background_image'}
                          size="sm"
                        >
                          {saving === 'hero_background_image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Video (optional) */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-600" />
                    Hero Video <span className="text-xs font-normal text-slate-500">(optional, plays over the background image)</span>
                  </Label>
                  {formData.hero_video_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveVideo}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove video
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Current Video Preview */}
                  <div className="relative w-full sm:w-64 h-40 rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-200">
                    {formData.hero_video_url ? (
                      <video
                        src={formData.hero_video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Video className="h-10 w-10" />
                        <span className="text-xs">No video set</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="w-full sm:w-auto"
                    >
                      {uploadingVideo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading video...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.hero_video_url ? 'Replace Video' : 'Upload Video'}
                        </>
                      )}
                    </Button>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>MP4 or WebM. Max 15MB — compress first for best performance (target: 3–5MB, 1920×1080, no audio).</p>
                      <p className="text-slate-400">Video is muted, loops, and is skipped on Save-Data / 2G connections.</p>
                    </div>

                    {/* Or enter URL manually */}
                    <div className="pt-2 border-t">
                      <Label htmlFor="hero_video_url" className="text-xs text-slate-500">Or enter video URL (Cloudinary recommended)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="hero_video_url"
                          value={formData.hero_video_url || ''}
                          onChange={(e) => handleChange('hero_video_url', e.target.value)}
                          placeholder="https://res.cloudinary.com/.../herovideo.mp4"
                          className="text-sm"
                        />
                        <Button
                          onClick={() => handleSave('hero_video_url')}
                          disabled={saving === 'hero_video_url'}
                          size="sm"
                        >
                          {saving === 'hero_video_url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Heading */}
              <div className="space-y-2">
                <Label htmlFor="hero_heading">Main Heading</Label>
                <p className="text-xs text-slate-500">Use a new line (Enter) to split into two lines. The second line will appear in blue.</p>
                <div className="flex gap-2">
                  <Textarea
                    id="hero_heading"
                    value={formData.hero_heading || ''}
                    onChange={(e) => handleChange('hero_heading', e.target.value)}
                    placeholder="DEFINING&#10;PURITY."
                    rows={2}
                    className="font-bold uppercase"
                  />
                  <Button 
                    onClick={() => handleSave('hero_heading')}
                    disabled={saving === 'hero_heading'}
                    size="sm"
                    className="self-start"
                  >
                    {saving === 'hero_heading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Hero Description */}
              <div className="space-y-2">
                <Label htmlFor="hero_description">Description Text</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="hero_description"
                    value={formData.hero_description || ''}
                    onChange={(e) => handleChange('hero_description', e.target.value)}
                    placeholder="Enter description text..."
                    rows={3}
                  />
                  <Button 
                    onClick={() => handleSave('hero_description')}
                    disabled={saving === 'hero_description'}
                    size="sm"
                    className="self-start"
                  >
                    {saving === 'hero_description' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900">Call-to-Action Button</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_text">Button Text</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_text"
                        value={formData.hero_cta_text || ''}
                        onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                        placeholder="Shop Now"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_text')}
                        disabled={saving === 'hero_cta_text'}
                        size="sm"
                      >
                        {saving === 'hero_cta_text' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_link">Button Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero_cta_link"
                        value={formData.hero_cta_link || ''}
                        onChange={(e) => handleChange('hero_cta_link', e.target.value)}
                        placeholder="/products"
                      />
                      <Button 
                        onClick={() => handleSave('hero_cta_link')}
                        disabled={saving === 'hero_cta_link'}
                        size="sm"
                      >
                        {saving === 'hero_cta_link' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-slate-900 rounded-xl">
                <p className="text-xs text-slate-400 mb-3">Preview</p>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-extrabold uppercase text-white leading-tight">
                    {formData.hero_heading?.split('\n')[0]}
                    {formData.hero_heading?.split('\n')[1] && (
                      <span className="block text-blue-400">{formData.hero_heading.split('\n')[1]}</span>
                    )}
                  </h2>
                  <p className="mt-3 text-sm text-white/70 max-w-md mx-auto">
                    {formData.hero_description}
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase text-white bg-blue-500 rounded-lg">
                      {formData.hero_cta_text || 'Shop Now'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
