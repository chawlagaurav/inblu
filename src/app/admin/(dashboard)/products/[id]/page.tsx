'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, Loader2, Save, Trash2, Package, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { AdminLoader } from '@/components/admin/admin-loader'
import { InventoryModal } from '@/components/admin/inventory-modal'
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
  categories: string[]
  imageUrl: string
  images: string[]
  sku: string | null
  specifications: Record<string, string> | null
  manualUrl: string | null
  relatedProductIds: string[]
  isBestSeller: boolean
  isActive: boolean
}

interface ProductListItem {
  id: string
  name: string
  imageUrl: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<ProductListItem[]>([])
  const [inventoryOpen, setInventoryOpen] = useState(false)
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
    relatedProductIds: [] as string[],
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

  const toggleRelatedProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedProductIds: prev.relatedProductIds.includes(id)
        ? prev.relatedProductIds.filter((p) => p !== id)
        : [...prev.relatedProductIds, id],
    }))
  }

  useEffect(() => {
    fetchProduct()
    fetchAllProducts()
  }, [productId])

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setAllProducts(data.filter((p: ProductListItem) => p.id !== productId))
      }
    } catch {
      console.error('Failed to fetch products')
    }
  }

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
        categories: data.categories && data.categories.length > 0 ? data.categories : (data.category ? [data.category] : []),
        imageUrl: data.imageUrl || '',
        sku: data.sku || '',
        manualUrl: data.manualUrl || '',
        serviceTenureMonths: String(data.serviceTenureMonths ?? 6),
        relatedProductIds: data.relatedProductIds || [],
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
          category: formData.categories[0] || '',
          categories: formData.categories,
          imageUrl: formData.imageUrl || '/products/placeholder.jpg',
          images: product?.images || [],
          sku: formData.sku || null,
          manualUrl: formData.manualUrl || null,
          specifications: specs,
          serviceTenureMonths: parseInt(formData.serviceTenureMonths) || 6,
          relatedProductIds: formData.relatedProductIds,
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
          <Button variant="outline" onClick={() => setInventoryOpen(true)}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Update Stock
          </Button>
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
                  placeholder="/products/product-image.jpg"
                />
              </div>

              {formData.imageUrl && (
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 rounded-lg overflow-hidden bg-blue-100">
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

          <Card>
            <CardHeader>
              <CardTitle>Suggested Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                Select products to show as suggestions when viewing this product. If none selected, related products will be shown based on category.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                {allProducts.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.relatedProductIds.includes(p.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.relatedProductIds.includes(p.id)}
                      onChange={() => toggleRelatedProduct(p.id)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-blue-100 flex-shrink-0">
                      {p.imageUrl && (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-sm text-slate-700 truncate">{p.name}</span>
                  </label>
                ))}
                {allProducts.length === 0 && (
                  <p className="text-sm text-slate-400 col-span-full">No other products available</p>
                )}
              </div>
              {formData.relatedProductIds.length > 0 && (
                <p className="text-xs text-blue-600">
                  {formData.relatedProductIds.length} product{formData.relatedProductIds.length > 1 ? 's' : ''} selected
                </p>
              )}
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

      {product && (
        <InventoryModal
          open={inventoryOpen}
          onOpenChange={setInventoryOpen}
          productId={product.id}
          productName={product.name}
          currentStock={parseInt(formData.stock) || 0}
          onStockUpdated={(newStock) => {
            setFormData((prev) => ({ ...prev, stock: String(newStock) }))
            setProduct((prev) => prev ? { ...prev, stock: newStock } : prev)
          }}
        />
      )}
    </div>
  )
}
