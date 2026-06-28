import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const heroKeys = [
      'hero_heading',
      'hero_description',
      'hero_cta_text',
      'hero_cta_link',
      'hero_background_image',
      'hero_video_url',
    ]

    const content = await prisma.marketingContent.findMany({
      where: {
        key: { in: heroKeys },
        isActive: true,
      },
    })

    // Convert to key-value object
    const heroContent: Record<string, string> = {}
    content.forEach((item) => {
      heroContent[item.key] = item.content || ''
    })

    return NextResponse.json(heroContent)
  } catch (error) {
    console.error('Error fetching hero content:', error)
    return NextResponse.json({}, { status: 500 })
  }
}
