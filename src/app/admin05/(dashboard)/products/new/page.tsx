'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { ImageUpload, MultiImageUpload, DocumentUpload } from '@/components/admin/image-upload'
import { SaleDiscountCard } from '@/components/admin/sale-discount-card'
import { toast } from 'sonner'

interface Category {
  id: string
  value: string
  label: string
  isActive: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categories: [] as string[],
    imageUrl: '',
    images: [] as string[],
    sku: '',
    manualUrl: '',
    serviceTenureMonths: '6',
    isBestSeller: false,
    isActive: true,
    specifications: '',
    isOnSale: false,
    discountMode: 'percent' as 'percent' | 'fixed',
    discountPercent: '',
    salePrice: '',
    excludeFromCoupons: false,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((c: Category) => c.isActive))
      }
    } catch {
      console.error('Failed to fetch categories')
    }
  }

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
      if (!formData.name || !formData.description || !formData.price || formData.categories.length === 0) {
        toast.error('Please fill in all required fields (including at least one category)')
        setIsLoading(false)
        return
      }

      // Validate discount fields if a sale is enabled.
      const priceNum = parseFloat(formData.price)
      let discountPercentToSend: number | null = null
      let salePriceToSend: number | null = null
      if (formData.isOnSale) {
        if (formData.discountMode === 'percent') {
          if (!formData.discountPercent) {
            toast.error('Enter a discount percentage or turn off the sale')
            setIsLoading(false)
            return
          }
          const pct = parseInt(formData.discountPercent)
          if (Number.isNaN(pct) || pct < 1 || pct > 99) {
            toast.error('Discount must be between 1 and 99')
            setIsLoading(false)
            return
          }
          discountPercentToSend = pct
        } else {
          if (!formData.salePrice) {
            toast.error('Enter a sale price or turn off the sale')
            setIsLoading(false)
            return
          }
          const sp = parseFloat(formData.salePrice)
          if (Number.isNaN(sp) || sp <= 0 || sp >= priceNum) {
            toast.error('Sale price must be greater than 0 and less than the regular price')
            setIsLoading(false)
            return
          }
          salePriceToSend = sp
        }
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
          price: priceNum,
          stock: 0, // Stock managed via Inventory section
          category: formData.categories[0],
          categories: formData.categories,
          imageUrl: formData.imageUrl || '/products/placeholder.jpg',
          images: formData.images,
          sku: formData.sku || null,
          manualUrl: formData.manualUrl || null,
          specifications: specs,
          serviceTenureMonths: parseInt(formData.serviceTenureMonths) || 6,
          isBestSeller: formData.isBestSeller,
          isActive: formData.isActive,
          isOnSale: formData.isOnSale,
          discountPercent: discountPercentToSend,
          salePrice: salePriceToSend,
          excludeFromCoupons: formData.excludeFromCoupons,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create product')
      }

      toast.success('Product created successfully')
      router.push('/admin05/products')
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
            <Link href="/admin05/products">
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

          <SaleDiscountCard formData={formData} setFormData={setFormData} />

          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Main Image *</Label>
                <p className="text-xs text-slate-500 mb-2">This will be the primary product image</p>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="products"
                />
              </div>

              <div>
                <Label>Additional Images</Label>
                <p className="text-xs text-slate-500 mb-2">Add more images for product gallery (max 5)</p>
                <MultiImageUpload
                  values={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  folder="products"
                  maxImages={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product Manual (PDF)</Label>
                <p className="text-xs text-slate-500 mb-2">Upload a PDF manual for this product</p>
                <DocumentUpload
                  value={formData.manualUrl}
                  onChange={(url) => setFormData({ ...formData, manualUrl: url })}
                  folder="manuals"
                  label="PDF Manual"
                />
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
              <Link href="/admin05/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </FadeIn>
    </div>
  )
}
