'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Package, Save, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductActions } from '@/components/admin/product-actions'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  imageUrl: string | null
  category: string
  categories: string[]
  price: number
  stock: number
  isActive: boolean
  isBestSeller: boolean
  displayOrder: number
}

interface SortableRowProps {
  product: Product
}

function SortableRow({ product }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors"
    >
      <td className="py-3 px-2 w-10">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-blue-100 flex-shrink-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{product.name}</p>
            <div className="flex gap-1 mt-0.5">
              {product.isBestSeller && (
                <Badge variant="secondary" className="text-xs">Best Seller</Badge>
              )}
              {!product.isActive && (
                <Badge variant="outline" className="text-xs text-slate-500">Inactive</Badge>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">
        <div className="flex flex-wrap gap-1">
          {product.categories && product.categories.length > 0
            ? product.categories.map((cat: string) => (
                <span key={cat} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {cat}
                </span>
              ))
            : <span>{product.category}</span>
          }
        </div>
      </td>
      <td className="py-3 px-4 text-sm font-medium text-slate-900">
        {formatCurrency(Number(product.price))}
      </td>
      <td className="py-3 px-4">
        <span className={`text-sm font-medium ${
          product.stock <= 10 ? 'text-red-600' : 'text-slate-900'
        }`}>
          {product.stock}
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <ProductActions product={{ id: product.id, name: product.name }} />
      </td>
    </tr>
  )
}

interface ProductsReorderListProps {
  products: Product[]
}

export function ProductsReorderList({ products: initialProducts }: ProductsReorderListProps) {
  const [products, setProducts] = useState(initialProducts)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedProducts = products.map((p, index) => ({
        id: p.id,
        displayOrder: index,
      }))

      const response = await fetch('/api/admin/products/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts }),
      })

      if (!response.ok) {
        throw new Error('Failed to save order')
      }

      setHasChanges(false)
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Failed to save product order')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setProducts(initialProducts)
    setHasChanges(false)
  }

  return (
    <div>
      {hasChanges && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-sm text-amber-800">You have unsaved changes to product order</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </div>
      )}
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No products found</p>
          <Button asChild className="mt-4">
            <Link href="/admin/products/new">Add your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="w-10"></th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {products.map((product) => (
                    <SortableRow key={product.id} product={product} />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  )
}
