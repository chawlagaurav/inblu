'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Truck, XCircle, Mail, FileDown, Save, Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Order {
  id: string
  status: string
  paymentStatus: string
  trackingNumber: string | null
  notes: string | null
  customerName: string
  email: string
}

interface OrderActionsProps {
  order: Order
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(order.status)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [notes, setNotes] = useState(order.notes || '')

  const handleUpdateOrder = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      toast.success('Order updated successfully')
      router.refresh()
    } catch {
      toast.error('Failed to update order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }

      toast.success('Order cancelled')
      router.refresh()
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = async (type: 'confirmation' | 'shipped' | 'custom') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      toast.success('Email sent successfully')
    } catch {
      toast.error('Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }

      const data = await response.json()
      window.open(data.pdfUrl, '_blank')

      toast.success('Invoice generated successfully')
    } catch {
      toast.error('Failed to generate invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewInvoice = () => {
    window.open(`/api/generate-invoice?orderId=${order.id}&preview=true`, '_blank')
  }

  const handleSendInvoiceEmail = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, sendEmail: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invoice')
      }

      const data = await response.json()
      if (data.emailSent) {
        toast.success('Invoice sent to customer')
      } else {
        toast.warning('Invoice generated but email failed to send')
      }
    } catch {
      toast.error('Failed to send invoice')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Update */}
        <div className="space-y-2">
          <Label>Order Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tracking Number */}
        <div className="space-y-2">
          <Label htmlFor="tracking">Tracking Number</Label>
          <Input
            id="tracking"
            placeholder="Enter tracking number..."
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this order..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button
          className="w-full"
          onClick={handleUpdateOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>

        <div className="border-t pt-4 space-y-2">
          {/* Quick Actions */}
          {status !== 'SHIPPED' && status !== 'DELIVERED' && status !== 'CANCELLED' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus('SHIPPED')
                toast.info('Status changed to Shipped. Click Save to confirm.')
              }}
            >
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSendEmail('confirmation')}
            disabled={isLoading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Resend Confirmation Email
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handlePreviewInvoice}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Invoice
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGenerateInvoice}
            disabled={isLoading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSendInvoiceEmail}
            disabled={isLoading}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Invoice to Customer
          </Button>

          {status !== 'CANCELLED' && status !== 'DELIVERED' && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancelOrder}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
