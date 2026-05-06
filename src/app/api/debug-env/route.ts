import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''
  
  // Extract port from URL
  const portMatch = dbUrl.match(/:(\d+)\//)
  const port = portMatch ? portMatch[1] : 'unknown'
  
  // Test database connection
  let dbConnected = false
  let dbError = null
  try {
    await prisma.$queryRaw`SELECT 1`
    dbConnected = true
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e)
  }
  
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    dbUrlPreview: dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) : 'NOT SET',
    directUrlPreview: directUrl ? directUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) : 'NOT SET',
    port,
    nodeEnv: process.env.NODE_ENV,
    dbConnected,
    dbError,
  })
}
