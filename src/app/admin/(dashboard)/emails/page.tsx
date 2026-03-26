import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, FileText, Send, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Emails & Invoices - Admin',
  description: 'Manage emails and invoices',
}

export default async function AdminEmailsPage() {
  // Get recent orders for invoice generation
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
  })

  const paidOrders = recentOrders.filter(o => o.paymentStatus === 'SUCCEEDED')
  const pendingOrders = recentOrders.filter(o => o.paymentStatus === 'PENDING')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Emails & Invoices</h1>
          <p className="text-slate-500 mt-1">Manage customer communications and invoices</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{recentOrders.length}</p>
                <p className="text-sm text-slate-500">Recent Orders</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{paidOrders.length}</p>
                <p className="text-sm text-slate-500">Paid (Invoice Ready)</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingOrders.length}</p>
                <p className="text-sm text-slate-500">Pending Payment</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Quick Actions */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Send emails and generate invoices</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-sky-200 rounded-xl bg-sky-50">
              <Mail className="h-8 w-8 text-sky-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Order Confirmation</h3>
              <p className="text-sm text-slate-500 mt-1">Send order confirmation emails to customers</p>
            </div>
            <div className="p-4 border border-sky-200 rounded-xl bg-sky-50">
              <Send className="h-8 w-8 text-sky-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Shipping Updates</h3>
              <p className="text-sm text-slate-500 mt-1">Notify customers about shipping status</p>
            </div>
            <div className="p-4 border border-sky-200 rounded-xl bg-sky-50">
              <FileText className="h-8 w-8 text-sky-600 mb-3" />
              <h3 className="font-semibold text-slate-900">Generate Invoices</h3>
              <p className="text-sm text-slate-500 mt-1">Create and download PDF invoices</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Orders List for Invoice Generation */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Generate invoices or send emails for orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sky-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Order</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Payment</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-sky-50 hover:bg-sky-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-sky-600 hover:underline">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                          <p className="text-xs text-slate-500">{order.email}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {formatCurrency(Number(order.totalAmount))}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={order.paymentStatus === 'SUCCEEDED' ? 'default' : 'secondary'}>
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/api/admin/orders/${order.id}/invoice`} target="_blank">
                                <FileText className="h-4 w-4 mr-1" />
                                Invoice
                              </a>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
