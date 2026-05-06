import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client during build time or when env vars are missing
    console.warn('Supabase environment variables not found')
    return null as ReturnType<typeof createBrowserClient>
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
