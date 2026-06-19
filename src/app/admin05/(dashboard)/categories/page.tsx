'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Folder, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { ImageUpload } from '@/components/admin/image-upload'

interface Category {
  id: string
  value: string
  label: string
  description: string | null
  imageUrl: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
}

const emptyCategory = {
  value: '',
  label: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  isActive: true,
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyCategory)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyCategory,
      displayOrder: categories.length,
    })
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({
      value: category.value,
      label: category.label,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error('Category name is required')
      return
    }

    // Auto-generate value from label if empty
    const value = form.value.trim() || form.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    setSaving(true)
    try {
      const payload = {
        value,
        label: form.label.trim(),
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      }

      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save category')
        return
      }

      toast.success(editingId ? 'Category updated' : 'Category created')
      setDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete category "${label}"? This will not affect products already in this category.`)) return

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Category deleted')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete category')
      }
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const toggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      })

      if (res.ok) {
        toast.success(category.isActive ? 'Category deactivated' : 'Category activated')
        fetchCategories()
      }
    } catch {
      toast.error('Failed to update category')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <FadeIn className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage product categories for your store
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No categories yet</h3>
            <p className="text-slate-600 mb-4">Create your first category to organize your products.</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <StaggerContainer className="grid gap-4">
          {categories.map((category) => (
            <StaggerItem key={category.id}>
              <Card className={!category.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <GripVertical className="h-5 w-5" />
                      <span className="text-sm font-mono">{category.displayOrder}</span>
                    </div>
                    
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.label}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Folder className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{category.label}</h3>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 font-mono">{category.value}</p>
                      {category.description && (
                        <p className="text-sm text-slate-600 truncate mt-1">{category.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(category)}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id, category.label)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Category Name *</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Water Purifiers"
              />
            </div>
            
            <div>
              <Label htmlFor="value">Slug (URL identifier)</Label>
              <Input
                id="value"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Auto-generated from name"
                className="font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty to auto-generate from name
              </p>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Category Image</Label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                folder="categories"
              />
            </div>
            
            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FadeIn>
  )
}
