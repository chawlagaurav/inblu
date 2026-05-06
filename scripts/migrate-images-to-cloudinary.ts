/**
 * Migration Script: Upload existing assets to Cloudinary
 * 
 * This script:
 * 1. Reads all images from public/products folder
 * 2. Reads all images from public/categories folder  
 * 3. Reads all PDFs from public/manuals folder
 * 4. Uploads them to Cloudinary
 * 5. Updates product imageUrl and manualUrl in the database
 * 6. Outputs category URL mapping for manual update
 * 
 * Usage: npx tsx scripts/migrate-images-to-cloudinary.ts
 */

import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface UploadResult {
  localPath: string
  localUrl: string
  cloudinaryUrl: string
  publicId: string
}

async function uploadToCloudinary(
  filePath: string, 
  folder: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<UploadResult> {
  const fileName = path.basename(filePath, path.extname(filePath))
  const localUrl = filePath.replace(path.join(process.cwd(), 'public'), '')
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: `inblu/${folder}`,
        public_id: fileName,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            localPath: filePath,
            localUrl,
            cloudinaryUrl: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          reject(new Error('No result from Cloudinary'))
        }
      }
    )
  })
}

async function uploadFolderImages(
  folderName: string, 
  extensions: string[] = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
): Promise<UploadResult[]> {
  const dir = path.join(process.cwd(), 'public', folderName)
  const results: UploadResult[] = []
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory public/${folderName} not found, skipping...`)
    return results
  }

  const files = fs.readdirSync(dir).filter(file => {
    const ext = path.extname(file).toLowerCase()
    return extensions.includes(ext)
  })

  console.log(`\n📁 Found ${files.length} files in public/${folderName}`)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const ext = path.extname(file).toLowerCase()
    const resourceType = ext === '.pdf' ? 'raw' : 'image'
    
    try {
      console.log(`⬆️  Uploading: ${file}`)
      const result = await uploadToCloudinary(filePath, folderName, resourceType)
      results.push(result)
      console.log(`✅ Uploaded: ${file}`)
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error)
    }
  }

  return results
}

async function main() {
  console.log('🚀 Starting asset migration to Cloudinary...\n')

  // Check Cloudinary config
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary configuration. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env')
    process.exit(1)
  }

  // Build URL mapping
  const urlMapping: Record<string, string> = {}

  // Upload product images
  console.log('\n' + '='.repeat(50))
  console.log('📦 PRODUCT IMAGES')
  console.log('='.repeat(50))
  const productImages = await uploadFolderImages('products')
  for (const result of productImages) {
    urlMapping[result.localUrl] = result.cloudinaryUrl
  }

  // Upload category images
  console.log('\n' + '='.repeat(50))
  console.log('🏷️  CATEGORY IMAGES')
  console.log('='.repeat(50))
  const categoryImages = await uploadFolderImages('categories')
  for (const result of categoryImages) {
    urlMapping[result.localUrl] = result.cloudinaryUrl
  }

  // Upload manuals (PDFs)
  console.log('\n' + '='.repeat(50))
  console.log('📄 PRODUCT MANUALS')
  console.log('='.repeat(50))
  const manuals = await uploadFolderImages('manuals', ['.pdf'])
  for (const result of manuals) {
    urlMapping[result.localUrl] = result.cloudinaryUrl
  }

  // Summary of uploads
  console.log('\n' + '='.repeat(50))
  console.log('📊 UPLOAD SUMMARY')
  console.log('='.repeat(50))
  console.log(`Product images: ${productImages.length}`)
  console.log(`Category images: ${categoryImages.length}`)
  console.log(`Manuals: ${manuals.length}`)
  console.log(`Total: ${Object.keys(urlMapping).length}`)

  // Update products in database
  console.log('\n' + '='.repeat(50))
  console.log('🔄 UPDATING DATABASE')
  console.log('='.repeat(50))

  const products = await prisma.product.findMany()
  let updatedCount = 0

  for (const product of products) {
    let updated = false
    let newImageUrl = product.imageUrl
    let newManualUrl = product.manualUrl
    const newImages: string[] = []

    // Check main image
    if (product.imageUrl && urlMapping[product.imageUrl]) {
      newImageUrl = urlMapping[product.imageUrl]
      updated = true
    }

    // Check manual URL
    if (product.manualUrl && urlMapping[product.manualUrl]) {
      newManualUrl = urlMapping[product.manualUrl]
      updated = true
    }

    // Check additional images
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (urlMapping[img]) {
          newImages.push(urlMapping[img])
          updated = true
        } else {
          newImages.push(img)
        }
      }
    }

    if (updated) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: newImageUrl,
          manualUrl: newManualUrl,
          images: newImages.length > 0 ? newImages : product.images,
        },
      })
      console.log(`\n✅ Updated: ${product.name}`)
      if (product.imageUrl !== newImageUrl) {
        console.log(`   Image: ${product.imageUrl} → ${newImageUrl}`)
      }
      if (product.manualUrl !== newManualUrl) {
        console.log(`   Manual: ${product.manualUrl} → ${newManualUrl}`)
      }
      updatedCount++
    }
  }

  console.log(`\n📦 Products updated: ${updatedCount}/${products.length}`)

  // Output category URL mapping for manual code update
  if (categoryImages.length > 0) {
    console.log('\n' + '='.repeat(50))
    console.log('🏷️  CATEGORY URLS (update in featured-categories.tsx)')
    console.log('='.repeat(50))
    for (const result of categoryImages) {
      console.log(`'${result.localUrl}' → '${result.cloudinaryUrl}'`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 MIGRATION COMPLETE!')
  console.log('='.repeat(50))

  // Print full URL mapping for reference
  console.log('\n📋 Full URL Mapping:')
  console.log(JSON.stringify(urlMapping, null, 2))

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error('Migration failed:', error)
  await prisma.$disconnect()
  process.exit(1)
})
