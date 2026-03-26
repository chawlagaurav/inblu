'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'

interface BannerData {
  text: string
  link: string | null
  active: boolean
}

export function AnnouncementBar() {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('announcement-dismissed') === 'true'
    }
    return false
  })

  useEffect(() => {
    if (dismissed) return

    fetch('/api/marketing/banner')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.active && data?.text) {
          setBanner(data)
        }
      })
      .catch(() => {})
  }, [dismissed])

  if (!banner || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('announcement-dismissed', 'true')
  }

  return (
    <div className="relative bg-sky-600 text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
        <span className="text-center font-medium">{banner.text}</span>
        {banner.link && (
          <Link
            href={banner.link}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-sky-100 transition-colors whitespace-nowrap"
          >
            Shop Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-sky-700 rounded transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
