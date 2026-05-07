import { config } from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env' })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadImage() {
  const imagePath = path.join(process.cwd(), 'public/countertop.png')
  
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath)
    process.exit(1)
  }

  console.log('Uploading', imagePath, 'to Cloudinary...')
  
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: 'inblu/categories',
    public_id: 'counter-top-filters',
    resource_type: 'image',
    overwrite: true,
  })

  console.log('Upload successful!')
  console.log('URL:', result.secure_url)
  console.log('Public ID:', result.public_id)
}

uploadImage().catch(console.error)
