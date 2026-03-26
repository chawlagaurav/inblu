'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Check, Copy, Droplets, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const STORAGE_KEY = 'discount_popup_state'

// Default fallback values
const DEFAULT_SETTINGS = {
  enabled: true,
  headline: 'GET 10% OFF YOUR FIRST ORDER',
  subtext: 'Join our community and get exclusive offers on water purification products.',
  discountCode: 'WELCOME10',
  discountPercentage: 10,
  delay: 5,
}

interface PopupSettings {
  enabled: boolean
  headline: string
  subtext: string
  discountCode: string
  discountPercentage: number
  delay: number
}

interface PopupState {
  shown: boolean
  claimed: boolean
  email?: string
}

export function DiscountPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [settings, setSettings] = useState<PopupSettings>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/marketing/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            enabled: data.enabled ?? DEFAULT_SETTINGS.enabled,
            headline: data.headline || DEFAULT_SETTINGS.headline,
            subtext: data.subtext || DEFAULT_SETTINGS.subtext,
            discountCode: data.discountCode || DEFAULT_SETTINGS.discountCode,
            discountPercentage: data.discountPercentage ?? DEFAULT_SETTINGS.discountPercentage,
            delay: data.delay ?? DEFAULT_SETTINGS.delay,
          })
        }
      } catch (err) {
        console.error('Failed to fetch popup settings:', err)
      } finally {
        setSettingsLoaded(true)
      }
    }
    fetchSettings()
  }, [])

  // Check localStorage and determine if popup should show
  useEffect(() => {
    if (!settingsLoaded || !settings.enabled) return

    const checkAndShowPopup = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const state: PopupState = JSON.parse(stored)
          // If already shown or claimed, don't show again
          if (state.shown || state.claimed) {
            return
          }
        }

        // Show popup after configured delay (with slight randomness for natural feel)
        const delayMs = (settings.delay * 1000) + Math.random() * 2000
        const timer = setTimeout(() => {
          setIsOpen(true)
          // Mark as shown
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ shown: true, claimed: false }))
        }, delayMs)

        return () => clearTimeout(timer)
      } catch {
        // If localStorage is not available, show popup anyway
        const timer = setTimeout(() => setIsOpen(true), settings.delay * 1000)
        return () => clearTimeout(timer)
      }
    }

    const cleanup = checkAndShowPopup()
    return cleanup
  }, [settingsLoaded, settings.enabled, settings.delay])

  // Exit intent detection
  useEffect(() => {
    if (!settingsLoaded || !settings.enabled) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top
      if (e.clientY <= 0) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const state: PopupState = JSON.parse(stored)
            if (state.shown || state.claimed) return
          }
          setIsOpen(true)
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ shown: true, claimed: false }))
        } catch {
          setIsOpen(true)
        }
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [settingsLoaded, settings.enabled])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Success!
      setIsSuccess(true)
      setShowConfetti(true)
      
      // Store claimed state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        shown: true, 
        claimed: true, 
        email 
      }))
      
      // Store coupon for later use
      localStorage.setItem('discount_coupon', settings.discountCode)

      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(settings.discountCode)
      setCopied(true)
      toast.success('Coupon code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = settings.discountCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success('Coupon code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }, [settings.discountCode])

  const handleClose = () => {
    setIsOpen(false)
    // Mark as shown when closed
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const state: PopupState = stored ? JSON.parse(stored) : { shown: false, claimed: false }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, shown: true }))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Don't render anything if popup is disabled or not yet loaded
  if (!settingsLoaded || !settings.enabled) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Confetti Effect */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="pointer-events-none absolute inset-0 z-10">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          opacity: 1, 
                          y: -20, 
                          x: Math.random() * 400 - 200,
                          rotate: 0 
                        }}
                        animate={{ 
                          opacity: 0, 
                          y: 400, 
                          x: Math.random() * 400 - 200,
                          rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
                        }}
                        transition={{ 
                          duration: 2 + Math.random(), 
                          delay: Math.random() * 0.5 
                        }}
                        className="absolute left-1/2 top-0"
                        style={{
                          width: 8 + Math.random() * 8,
                          height: 8 + Math.random() * 8,
                          backgroundColor: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#22c55e', '#fbbf24'][
                            Math.floor(Math.random() * 6)
                          ],
                          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close popup"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header Decoration */}
              <div className="relative h-32 bg-gradient-to-br from-sky-400 to-sky-600 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="waves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="8" fill="white" fillOpacity="0.3" />
                      </pattern>
                    </defs>
                    <rect fill="url(#waves)" width="100" height="100" />
                  </svg>
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Droplets className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                
                {/* Sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute right-8 top-6"
                >
                  <Sparkles className="h-6 w-6 text-white/60" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute left-8 bottom-6"
                >
                  <Sparkles className="h-4 w-4 text-white/40" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 pt-6">
                {!isSuccess ? (
                  <>
                    {/* Form State */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {settings.headline}
                      </h2>
                      <p className="text-slate-600 text-sm">
                        {settings.subtext}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setError('')
                          }}
                          className={`pl-12 h-12 rounded-xl border-2 transition-colors ${
                            error 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-slate-200 focus:border-sky-500'
                          }`}
                          disabled={isSubmitting}
                        />
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500 text-center"
                        >
                          {error}
                        </motion.p>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/25"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          'Unlock Discount'
                        )}
                      </Button>
                    </form>

                    <button
                      onClick={handleClose}
                      className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Maybe later
                    </button>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>

                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        You&apos;re In! 🎉
                      </h2>
                      <p className="text-slate-600 text-sm mb-6">
                        Use this code at checkout to get {settings.discountPercentage}% off your first order.
                      </p>

                      {/* Coupon Code */}
                      <div className="relative mb-6">
                        <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-4">
                          <span className="text-2xl font-bold tracking-wider text-sky-600">
                            {settings.discountCode}
                          </span>
                          <Button
                            onClick={handleCopyCode}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-sky-300 hover:bg-sky-100"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-sky-600" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleClose}
                        className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                      >
                        Start Shopping
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                <p className="text-center text-xs text-slate-400">
                  By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
