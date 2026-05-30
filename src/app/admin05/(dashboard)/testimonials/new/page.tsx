'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { ImageUpload } from '@/components/admin/image-upload'
import { toast } from 'sonner'

export default function NewTestimonialPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    authorName: '',
    content: '',
    rating: 5,
    authorAvatar: '',
    isApproved: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.authorName || !formData.content) {
        toast.error('Please fill in all required fields')
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create testimonial')
        return
      }

      toast.success('Testimonial created successfully')
      router.push('/admin05/testimonials')
    } catch {
      toast.error('Failed to create testimonial')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FadeIn className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin05/testimonials"
          className="inline-flex items-center text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Testimonials
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Testimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="authorName">Customer Name *</Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="John Smith"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Customer Photo</Label>
              <p className="text-xs text-slate-500 mb-2">Optional - adds credibility to the testimonial</p>
              <ImageUpload
                value={formData.authorAvatar}
                onChange={(url) => setFormData({ ...formData, authorAvatar: url })}
                folder="testimonials"
              />
            </div>

            <div>
              <Label htmlFor="content">Testimonial Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the customer's testimonial here..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isApproved"
                checked={formData.isApproved}
                onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isApproved" className="cursor-pointer">
                Approved (visible on website)
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Testimonial
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin05/testimonials')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
