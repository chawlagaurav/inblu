import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [textEntry, linkEntry, activeEntry] = await Promise.all([
      prisma.marketingContent.findUnique({ where: { key: 'promo_banner_text' } }),
      prisma.marketingContent.findUnique({ where: { key: 'promo_banner_link' } }),
      prisma.marketingContent.findUnique({ where: { key: 'promo_banner_active' } }),
    ])

    const active = activeEntry?.content === 'true'
    const text = textEntry?.content || ''
    const link = linkEntry?.content || null

    return NextResponse.json({ text, link, active })
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json({ text: '', link: null, active: false })
  }
}
