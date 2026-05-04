'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  Send, 
  Loader2, 
  CheckCircle, 
  Calendar,
  Package,
  Phone,
  Mail,
  User,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { toast } from 'sonner'

const serviceTypes = [
  { value: 'INSTALLATION', label: 'New Installation', description: 'Install a new water filtration system' },
  { value: 'MAINTENANCE', label: 'Maintenance', description: 'Regular maintenance and checkup' },
  { value: 'REPAIR', label: 'Repair', description: 'Fix an issue with your system' },
  { value: 'FILTER_REPLACEMENT', label: 'Filter Replacement', description: 'Replace filters or cartridges' },
  { value: 'INSPECTION', label: 'Inspection', description: 'System inspection and assessment' },
  { value: 'WARRANTY_CLAIM', label: 'Warranty Claim', description: 'Product covered under warranty' },
  { value: 'OTHER', label: 'Other', description: 'Other service request' },
]

export default function ServiceRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    orderId: '',
    productName: '',
    purchaseDate: '',
    issueDescription: '',
    preferredDate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.serviceType) {
      toast.error('Please select a service type')
      return
    }

    setSubmitting(true)
    
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      const data = await res.json()
      setTicketNumber(data.ticketNumber)
      setSubmitted(true)
      toast.success('Service request submitted successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white min-h-screen">
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <FadeIn>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-8 pb-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Service Request Submitted!</h2>
                  <p className="text-slate-600 mb-6">
                    Your service request has been received. Our team will review it and get back to you shortly.
                  </p>
                  
                  <div className="bg-white rounded-xl p-6 border border-green-200 mb-6">
                    <p className="text-sm text-slate-500 mb-1">Your Ticket Number</p>
                    <p className="text-3xl font-mono font-bold text-blue-600">{ticketNumber}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Please save this number to track your service request.
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p>We will contact you within 24-48 business hours.</p>
                    <p>For urgent matters, call us at <strong>0431 318 665</strong></p>
                  </div>

                  <div className="mt-8 flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false)
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          serviceType: '',
                          orderId: '',
                          productName: '',
                          purchaseDate: '',
                          issueDescription: '',
                          preferredDate: '',
                        })
                      }}
                    >
                      Submit Another Request
                    </Button>
                    <Button asChild>
                      <a href="/">Back to Home</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Service Request
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                Need help with your water filtration system? Submit a service request and our 
                expert team will assist you promptly.
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <Card className="border-blue-100 shadow-xl">
              <CardHeader className="border-b border-blue-100 bg-blue-50/50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Service Request Form
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Service Type Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      Service Type
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {serviceTypes.map((type) => (
                        <label
                          key={type.value}
                          className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.serviceType === type.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="serviceType"
                            value={type.value}
                            checked={formData.serviceType === type.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="font-medium text-slate-900">{type.label}</span>
                          <span className="text-xs text-slate-500 mt-1">{type.description}</span>
                          {formData.serviceType === type.value && (
                            <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-blue-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          placeholder="John Smith"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          placeholder="0412 345 678"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Order Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="orderId">Order ID *</Label>
                        <Input
                          id="orderId"
                          name="orderId"
                          required
                          placeholder="e.g., A1B2C3D4"
                          value={formData.orderId}
                          onChange={handleChange}
                          className="mt-1 font-mono uppercase"
                          maxLength={8}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          First 8 characters from your order confirmation email
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="productName">Product Name/Model</Label>
                        <Input
                          id="productName"
                          name="productName"
                          placeholder="e.g., Inblu Pro Filter System"
                          value={formData.productName}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                          id="purchaseDate"
                          name="purchaseDate"
                          type="date"
                          value={formData.purchaseDate}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Issue Description */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Issue Description
                    </h3>
                    <div>
                      <Label htmlFor="issueDescription">Describe the issue or service needed *</Label>
                      <Textarea
                        id="issueDescription"
                        name="issueDescription"
                        required
                        placeholder="Please describe the issue you're experiencing or the service you need..."
                        value={formData.issueDescription}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Preferred Date */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Preferred Service Date
                    </h3>
                    <div>
                      <Label htmlFor="preferredDate">Preferred Date (Optional)</Label>
                      <Input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 max-w-xs"
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        We'll do our best to accommodate your preferred date.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-200">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Submit Service Request
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-slate-500 mt-3">
                      By submitting this form, you agree to our service terms. We typically respond within 24-48 business hours.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </FadeInOnScroll>

          {/* Help Section */}
          <FadeInOnScroll delay={0.1}>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="text-center border-blue-100">
                <CardContent className="pt-6">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900">Call Us</h4>
                  <p className="text-sm text-slate-600 mt-1">0431 318 665</p>
                  <p className="text-xs text-slate-400">Mon-Fri 9am-6pm</p>
                </CardContent>
              </Card>
              <Card className="text-center border-blue-100">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900">Email Us</h4>
                  <p className="text-sm text-slate-600 mt-1">support@inblu.com.au</p>
                  <p className="text-xs text-slate-400">24hr response</p>
                </CardContent>
              </Card>
              <Card className="text-center border-blue-100">
                <CardContent className="pt-6">
                  <Wrench className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900">Expert Service</h4>
                  <p className="text-sm text-slate-600 mt-1">Certified Technicians</p>
                  <p className="text-xs text-slate-400">Quality guaranteed</p>
                </CardContent>
              </Card>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}
