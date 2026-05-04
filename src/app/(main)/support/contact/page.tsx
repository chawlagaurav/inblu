'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { toast } from 'sonner'

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    details: '+61 431 318 665',
    subtext: 'Mon-Fri 9am-6pm AEST',
    href: 'tel:+61 431 318 665',
  },
  {
    icon: Mail,
    title: 'Email',
    details: 'support@inblu.com.au',
    subtext: 'We reply within 24 hours',
    href: 'mailto:support@inblu.com.au',
  },
  {
    icon: MapPin,
    title: 'Address',
    details: '8R5C+W4 Marsden Park',
    subtext: 'New South Wales, Australia',
    href: 'https://maps.app.goo.gl/KiXj1Q9iVubCU47K8',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: 'Mon - Fri: 9am - 6pm',
    subtext: 'Sat: 10am - 4pm AEST',
    href: null,
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      toast.success('Your message has been sent successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Contact Us
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                Have questions about our water filtration products? We&apos;re here to help. 
                Reach out to our friendly support team.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <FadeInOnScroll>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Get in Touch</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contactInfo.map((item) => (
                    <Card key={item.title} className="border-blue-100 rounded-2xl hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        {item.href ? (
                          <a href={item.href} className="block">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <item.icon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                <p className="text-blue-600 font-medium">{item.details}</p>
                                <p className="text-sm text-slate-500">{item.subtext}</p>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <item.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{item.title}</h3>
                              <p className="text-slate-700 font-medium">{item.details}</p>
                              <p className="text-sm text-slate-500">{item.subtext}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                  <h3 className="font-semibold text-slate-900 mb-2">Need Urgent Help?</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    For urgent installation or service issues, call our priority support line.
                  </p>
                  <a 
                    href="tel:+61431318665" 
                    className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                  >
                    <Phone className="h-4 w-4" />
                    +61431318665 (Priority Line)
                  </a>
                </div>
              </div>
            </FadeInOnScroll>

            {/* Contact Form */}
            <FadeInOnScroll delay={0.1}>
              <Card className="border-blue-100 rounded-2xl">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                  
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Message Sent!</h3>
                      <p className="text-slate-600">
                        Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                      </p>
                      <Button 
                        onClick={() => setSubmitted(false)} 
                        variant="outline" 
                        className="mt-6"
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            placeholder="John Smith"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            placeholder="0400 000 000"
                          />
                        </div>
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                            Subject
                          </label>
                          <select
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                          >
                            <option value="">Select a topic</option>
                            <option value="product-inquiry">Product Inquiry</option>
                            <option value="installation">Installation Support</option>
                            <option value="order-status">Order Status</option>
                            <option value="returns">Returns & Refunds</option>
                            <option value="technical">Technical Support</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors resize-none"
                          placeholder="How can we help you?"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full gap-2" 
                        size="lg"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </div>
  )
}
