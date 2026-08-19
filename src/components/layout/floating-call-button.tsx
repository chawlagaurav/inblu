'use client'

import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'

// Business phone number — matches the tel: links used across the site
// (header, contact, support pages).
const PHONE_NUMBER = '+61431318665'
const PHONE_DISPLAY = '+61 431 318 665'

/**
 * A floating "call the business" button pinned to the bottom-right corner on
 * every store page. Tapping it opens the phone dialer (tel:) so mobile users
 * can reach us in one tap. Styled in the site's blue theme with a gentle
 * pulsing ring to draw the eye.
 */
export function FloatingCallButton() {
  return (
    <motion.a
      href={`tel:${PHONE_NUMBER}`}
      aria-label={`Call us at ${PHONE_DISPLAY}`}
      title={`Call us at ${PHONE_DISPLAY}`}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.5 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/40 transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
    >
      {/* Pulsing ring to attract attention */}
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-500/50" />
      <Phone className="h-6 w-6" />
    </motion.a>
  )
}
