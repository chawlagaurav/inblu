'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, Loader2, Save, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { AdminLoader } from '@/components/admin/admin-loader'
import { toast } from 'sonner'

const categories = [
  { value: 'ro-purifiers', label: 'RO Water Purifiers' },
  { value: 'water-ionisers', label: 'Water Ionisers' },
  { value: 'undersink-filters', label: 'Undersink Filters' },
  { value: 'replacement-filters', label: 'Replacement Filters' },
]

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  imageUrl: string
  images: string[]
  sku: string | null
  specifications: Record<string, string> | null
  manualUrl: string | null
  isBestSeller: boolean
  isActive: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
    sku: '',
    manualUrl: '',
    isBestSeller: false,
    isActive: true,
    specifications: '',
  })

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (!response.ok) {
        throw new Error('Product not found')
      }
      const data = await response.json()
      setProduct(data)
      setFormData({
        name: data.name,
        description: data.description,
        price: String(data.price),
        stock: String(data.stock),
        category: data.category,
        imageUrl: data.imageUrl || '',
        sku: data.sku || '',
        manualUrl: data.manualUrl || '',
        isBestSeller: data.isBestSeller,
        isActive: data.isActive,
        specifications: data.specifications ? JSON.stringify(data.specifications, null, 2) : '',
      })
    } catch {
      toast.error('Failed to load product')
      router.push('/admin/products')
    } finally {
      setIsLoading(false)
    }
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
    setIsSaving(true)

    try {
      let specs = {}
      if (formData.specifications) {
        try {
          specs = JSON.parse(formData.specifications)
        } catch {
          toast.error('Invalid JSON in specifications')
          setIsSaving(false)
          return
        }
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category: formData.category,
          imageUrl: formData.imageUrl || '/products/placeholder.jpg',
          images: product?.images || [],
          sku: formData.sku || null,
          manualUrl: formData.manualUrl || null,
          specifications: specs,
          isBestSeller: formData.isBestSeller,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      toast.success('Product updated successfully')
      router.push('/admin/products')
      router.refresh()
    } catch {
      toast.error('Failed to update product')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <AdminLoader fullScreen={false} />
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Product not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>
    )
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Edit Product</h1>
            <p className="text-slate-500 mt-1">Update product information</p>
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
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBestSeller"
                    name="isBestSeller"
                    checked={formData.isBestSeller}
                    onChange={handleChange}
                    className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
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
                    className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
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
                  placeholder="/products/product-image.jpg"
                />
              </div>

              {formData.imageUrl && (
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 rounded-lg overflow-hidden bg-sky-100">
                    <Image
                      src={formData.imageUrl}
                      alt="Product preview"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-slate-500">Current image preview</p>
                </div>
              )}

              <div className="border-2 border-dashed border-sky-200 rounded-2xl p-6 text-center">
                <Upload className="h-8 w-8 text-sky-400 mx-auto mb-3" />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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
