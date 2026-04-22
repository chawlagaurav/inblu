'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeInOnScroll } from '@/components/motion'
import { toast } from 'sonner'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubscribed(true)
    setIsSubmitting(false)
    toast.success('Successfully subscribed to our newsletter!')
    setEmail('')
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-500 to-blue-600">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="relative isolate overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stay in the Loop
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Subscribe to our newsletter for exclusive offers, new arrivals, and style tips.
              </p>

              {isSubscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 flex items-center justify-center gap-2 text-white"
                >
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-lg font-medium">Thanks for subscribing!</span>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="min-w-0 flex-1 max-w-md bg-white/90 border-0 focus-visible:ring-white"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"
                        />
                        Subscribing...
                      </span>
                    ) : (
                      <>
                        Subscribe
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <p className="mt-4 text-sm text-blue-200">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
