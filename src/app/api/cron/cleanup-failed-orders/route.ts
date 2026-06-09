import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Verify this is being called by Vercel Cron (or internally)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    // Remove unpaid orders older than 24h. This covers explicitly FAILED payments
    // as well as orders abandoned on the Stripe page (left in PENDING/PROCESSING).
    // Orders that succeeded or were refunded are never touched.
    const result = await prisma.order.deleteMany({
      where: {
        status: 'PENDING',
        paymentStatus: { in: ['FAILED', 'PENDING', 'PROCESSING'] },
        createdAt: { lt: cutoff },
      },
    })

    console.log(`Cron: deleted ${result.count} unpaid orders older than 24h`)

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
