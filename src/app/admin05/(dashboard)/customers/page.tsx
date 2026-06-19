'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Mail, Phone, ShoppingBag, DollarSign, Users, UserX, Download, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { toast } from 'sonner'

interface Customer {
  type: 'registered' | 'guest'
  id: string
  email: string
  name: string
  phone: string | null
  orderCount: number
  totalSpent: number
  lastOrder: string | null
  createdAt: string
  address: Record<string, string> | null
}

interface Stats {
  total: number
  registered: number
  guests: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
  }).format(new Date(dateStr))
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, registered: 0, guests: 0 })
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCustomers()
  }, [typeFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter === 'guests' ? 'guests' : 'registered')
      
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id))
    const hasRegistered = selectedCustomers.some(c => c.type === 'registered')
    const hasGuest = selectedCustomers.some(c => c.type === 'guest')
    
    const message = hasGuest 
      ? `Are you sure you want to delete ${selectedIds.size} customer(s)? Guest customer orders will also be deleted.`
      : `Are you sure you want to delete ${selectedIds.size} customer(s)?`
    
    if (!confirm(message)) return

    setDeleting(true)
    try {
      const customerType = hasRegistered && hasGuest ? 'mixed' : hasRegistered ? 'registered' : 'guest'
      
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: Array.from(selectedIds),
          customerType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message)
        setSelectedIds(new Set())
        fetchCustomers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete customers')
      }
    } catch (error) {
      console.error('Error deleting customers:', error)
      toast.error('Failed to delete customers')
    } finally {
      setDeleting(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(query))
    )
  })

  const allSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.has(c.id))
  const someSelected = selectedIds.size > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 mt-1">Manage your customers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {someSelected && (
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete ({selectedIds.size})
              </Button>
            )}
            <a
              href={`/api/admin/customers/export?${new URLSearchParams({
                ...(searchQuery ? { search: searchQuery } : {}),
                ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
              }).toString()}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </a>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Customers</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.registered}</p>
                <p className="text-sm text-slate-500">Registered</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <UserX className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.guests}</p>
                <p className="text-sm text-slate-500">Guest Customers</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Filter Tabs */}
      <FadeIn delay={0.05}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Customers' },
            { key: 'registered', label: 'Registered' },
            { key: 'guests', label: 'Guests' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setTypeFilter(tab.key); setSelectedIds(new Set()) }}
            >
              <Badge
                variant={typeFilter === tab.key ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
              >
                {tab.label}
              </Badge>
            </button>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Customer List</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Orders</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Total Spent</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Shipping Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(customer.id)}
                            onCheckedChange={(checked) => handleSelectOne(customer.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{customer.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={customer.type === 'registered' ? 'secondary' : 'outline'}>
                            {customer.type === 'registered' ? 'Registered' : 'Guest'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-sm text-slate-600">
                            <ShoppingBag className="h-4 w-4" />
                            {customer.orderCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 font-medium text-slate-900">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {customer.address ? (
                            <div className="text-sm text-slate-600 max-w-[200px]">
                              <p className="truncate">{customer.address.address}</p>
                              {customer.address.apartment && <p className="truncate">{customer.address.apartment}</p>}
                              <p className="truncate text-slate-400">
                                {[customer.address.city, customer.address.state, customer.address.postcode].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {customer.lastOrder ? formatDate(customer.lastOrder) : 'No orders'}
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
