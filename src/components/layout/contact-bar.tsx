'use client'

import { Phone } from 'lucide-react'

export function ContactBar() {
  return (
    <div className="bg-slate-900 text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center sm:justify-end gap-2">
        <Phone className="h-4 w-4" />
        <a 
          href="tel:+61431318665" 
          className="font-medium hover:text-blue-300 transition-colors"
        >
          +61 431 318 665
        </a>
        <span className="hidden sm:inline text-slate-400">|</span>
        <span className="hidden sm:inline text-slate-400">Call us for enquiries</span>
      </div>
    </div>
  )
}
