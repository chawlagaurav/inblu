import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Verify admin access
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role !== 'ADMIN') {
    return null
  }

  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'products'
    const fileType = (formData.get('type') as string) || 'image' // 'image' | 'document' | 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type based on type parameter
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const documentTypes = ['application/pdf']
    const videoTypes = ['video/mp4', 'video/webm']
    const allowedTypes =
      fileType === 'document' ? documentTypes :
      fileType === 'video' ? videoTypes :
      imageTypes

    if (!allowedTypes.includes(file.type)) {
      const allowedStr =
        fileType === 'document' ? 'PDF' :
        fileType === 'video' ? 'MP4, WebM' :
        'JPEG, PNG, WebP, GIF'
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedStr}` },
        { status: 400 }
      )
    }

    // Validate file size (15MB video, 10MB documents, 5MB images)
    const maxSize =
      fileType === 'video' ? 15 * 1024 * 1024 :
      fileType === 'document' ? 10 * 1024 * 1024 :
      5 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}MB. Please compress your video before uploading.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique public ID based on filename
    const originalName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    const timestamp = Date.now()
    const publicId = `${originalName}-${timestamp}`

    // Upload to Cloudinary — note: cloudinary's 'video' resource_type also covers WebM
    const resourceType =
      fileType === 'document' ? 'raw' :
      fileType === 'video' ? 'video' :
      'image'
    const result = await uploadToCloudinary(buffer, {
      folder: `inblu/${folder}`,
      resourceType: resourceType as 'image' | 'raw' | 'auto' | 'video',
      publicId,
    })

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
