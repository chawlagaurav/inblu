import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''
  
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Show partial connection string for debugging (hide password)
    dbUrlPreview: dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) : 'NOT SET',
    directUrlPreview: directUrl ? directUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  })
}
