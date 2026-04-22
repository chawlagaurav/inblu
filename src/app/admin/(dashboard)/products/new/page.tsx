'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { toast } from 'sonner'

const categories = [
  { value: 'ro-purifiers', label: 'RO Water Purifiers' },
  { value: 'water-ionisers', label: 'Water Ionisers' },
  { value: 'undersink-filters', label: 'Undersink Filters' },
  { value: 'replacement-filters', label: 'Replacement Filters' },
]

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categories: [] as string[],
    imageUrl: '',
    sku: '',
    manualUrl: '',
    serviceTenureMonths: '6',
    isBestSeller: false,
    isActive: true,
    specifications: '',
  })

  const toggleCategory = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.stock || formData.categories.length === 0) {
        toast.error('Please fill in all required fields (including at least one category)')
        setIsLoading(false)
        return
      }

      let specs = {}
      if (formData.specifications) {
        try {
          specs = JSON.parse(formData.specifications)
        } catch {
          toast.error('Invalid JSON in specifications')
          setIsLoading(false)
          return
        }
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category: formData.categories[0],
          categories: formData.categories,
          imageUrl: formData.imageUrl || '/products/placeholder.jpg',
          images: [],
          sku: formData.sku || null,
          manualUrl: formData.manualUrl || null,
          specifications: specs,
          serviceTenureMonths: parseInt(formData.serviceTenureMonths) || 6,
          isBestSeller: formData.isBestSeller,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create product')
      }

      toast.success('Product created successfully')
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add Product</h1>
            <p className="text-slate-500 mt-1">Create a new product</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Enter product description"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (AUD) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Categories *</Label>
                  <div className="mt-1 space-y-2 rounded-lg border border-slate-200 p-3">
                    {categories.map((category) => (
                      <label key={category.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.value)}
                          onChange={() => toggleCategory(category.value)}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{category.label}</span>
                      </label>
                    ))}
                    {formData.categories.length === 0 && (
                      <p className="text-xs text-slate-400">Select at least one category</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Optional product SKU"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceTenureMonths">Service Tenure (months)</Label>
                  <Input
                    id="serviceTenureMonths"
                    name="serviceTenureMonths"
                    type="number"
                    min="1"
                    value={formData.serviceTenureMonths}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="6"
                  />
                  <p className="text-xs text-slate-500 mt-1">Service due reminder period after delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBestSeller"
                    name="isBestSeller"
                    checked={formData.isBestSeller}
                    onChange={handleChange}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isBestSeller">Best Seller</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isActive">Active (visible to customers)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Main Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="/products/product-image.jpg or https://..."
                />
              </div>

              <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center">
                <Upload className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop images here, or enter URL above
                </p>
                <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents & Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manualUrl">Manual PDF URL</Label>
                <Input
                  id="manualUrl"
                  name="manualUrl"
                  value={formData.manualUrl}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="/manuals/product-manual.pdf"
                />
              </div>

              <div>
                <Label htmlFor="specifications">Specifications (JSON format)</Label>
                <Textarea
                  id="specifications"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 font-mono text-sm"
                  placeholder='{"Weight": "2.5 kg", "Dimensions": "30x20x15 cm"}'
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter specifications as JSON object
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </FadeIn>
    </div>
  )
}
