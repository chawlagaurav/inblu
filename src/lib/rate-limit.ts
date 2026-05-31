// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated service

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.resetTime < now) {
    // First request or window expired - create new entry
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Auth endpoints: 5 attempts per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  
  // Subscribe: 3 per hour per IP
  subscribe: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  
  // Enquiry form: 5 per hour
  enquiry: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  
  // Checkout: 10 per hour (legitimate users may retry)
  checkout: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  
  // General API: 100 per minute
  api: { windowMs: 60 * 1000, maxRequests: 100 },
}

export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback - in production this might be the proxy's IP
  return 'unknown'
}
