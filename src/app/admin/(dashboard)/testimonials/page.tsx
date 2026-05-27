'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Star, Pencil, Trash2, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { ImageUpload } from '@/components/admin/image-upload'
import { toast } from 'sonner'

interface Testimonial {
  id: string
  content: string
  rating: number
  authorName: string
  authorAvatar: string | null
  isApproved: boolean
  createdAt: string
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setTestimonials(data)
      }
    } catch {
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial({ ...testimonial })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTestimonial) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/testimonials/${editingTestimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestimonial),
      })

      if (res.ok) {
        toast.success('Testimonial updated')
        setEditDialogOpen(false)
        fetchTestimonials()
      } else {
        toast.error('Failed to update testimonial')
      }
    } catch {
      toast.error('Failed to update testimonial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete testimonial from "${name}"?`)) return

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Testimonial deleted')
        fetchTestimonials()
      } else {
        toast.error('Failed to delete testimonial')
      }
    } catch {
      toast.error('Failed to delete testimonial')
    }
  }

  const toggleApproval = async (testimonial: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !testimonial.isApproved }),
      })

      if (res.ok) {
        toast.success(testimonial.isApproved ? 'Testimonial hidden' : 'Testimonial approved')
        fetchTestimonials()
      }
    } catch {
      toast.error('Failed to update testimonial')
    }
  }

  const approvedCount = testimonials.filter((t) => t.isApproved).length
  const pendingCount = testimonials.filter((t) => !t.isApproved).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Testimonials</h1>
            <p className="text-slate-500 mt-1">
              Manage customer reviews and testimonials ({approvedCount} approved, {pendingCount} pending)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/testimonials/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Link>
          </Button>
        </div>
      </FadeIn>

      {testimonials.length === 0 ? (
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No testimonials yet.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/testimonials/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Testimonial
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid gap-6">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <Card className={!testimonial.isApproved ? 'opacity-70' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {testimonial.authorAvatar ? (
                        <Image
                          src={testimonial.authorAvatar}
                          alt={testimonial.authorName}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {testimonial.authorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{testimonial.authorName}</h3>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge 
                          variant={testimonial.isApproved ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleApproval(testimonial)}
                        >
                          {testimonial.isApproved ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-slate-600">{testimonial.content}</p>
                      <p className="text-sm text-slate-400 mt-2">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(testimonial)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(testimonial.id, testimonial.authorName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-authorName">Customer Name</Label>
                <Input
                  id="edit-authorName"
                  value={editingTestimonial.authorName}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, authorName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Customer Photo</Label>
                <ImageUpload
                  value={editingTestimonial.authorAvatar || ''}
                  onChange={(url) =>
                    setEditingTestimonial({ ...editingTestimonial, authorAvatar: url })
                  }
                  folder="testimonials"
                />
              </div>

              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingTestimonial.content}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, content: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setEditingTestimonial({ ...editingTestimonial, rating: star })
                      }
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= editingTestimonial.rating
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
                  id="edit-isApproved"
                  checked={editingTestimonial.isApproved}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, isApproved: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="edit-isApproved">Approved</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
