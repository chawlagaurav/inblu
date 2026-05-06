'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  className?: string
}

export function ImageUpload({ value, onChange, folder = 'products', className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative inline-block">
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-200">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}

interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  folder?: string
  maxImages?: number
  className?: string
}

export function MultiImageUpload({ 
  values = [], 
  onChange, 
  folder = 'products',
  maxImages = 5,
  className 
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = async (file: File) => {
    if (!file) return
    if (values.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onChange([...values, data.url])
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [values])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3 mb-3">
        {values.map((url, index) => (
          <div key={url} className="relative">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {values.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="multi-image-upload"
            disabled={isUploading}
          />
          <label htmlFor="multi-image-upload" className="cursor-pointer flex items-center justify-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm text-slate-600">Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-slate-600">
                  Add image ({values.length}/{maxImages})
                </span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}

interface DocumentUploadProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  accept?: string
  label?: string
  className?: string
}

export function DocumentUpload({ 
  value, 
  onChange, 
  folder = 'manuals',
  accept = '.pdf',
  label = 'PDF Document',
  className 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('type', 'document')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Document uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemove = () => {
    onChange('')
  }

  // Extract filename from URL
  const getFileName = (url: string) => {
    try {
      const parts = url.split('/')
      return parts[parts.length - 1] || 'document.pdf'
    } catch {
      return 'document.pdf'
    }
  }

  return (
    <div className={className}>
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {getFileName(value)}
            </p>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View document
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-500"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="document-upload"
            disabled={isUploading}
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-600">Uploading...</p>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">
                  Drag and drop a {label}, or click to browse
                </p>
                <p className="text-xs text-slate-400">PDF up to 10MB</p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}
