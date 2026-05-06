import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendNewsletterEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

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

// GET: Fetch all subscribers
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subscribers)
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

// POST: Send newsletter to all subscribers
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, content } = body

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Get all subscribers
    const subscribers = await prisma.subscriber.findMany({
      select: { email: true },
    })

    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 400 })
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 10
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      const results = await Promise.allSettled(
        batch.map((sub) => sendNewsletterEmail(sub.email, subject, content))
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++
        } else {
          failCount++
        }
      })

      // Small delay between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers${failCount > 0 ? `, ${failCount} failed` : ''}`,
      successCount,
      failCount,
      totalSubscribers: subscribers.length,
    })
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
