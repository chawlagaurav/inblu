'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Wrench, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  ShoppingCart,
  Mail,
  User,
  Package,
  Loader2,
  Save,
  X,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FadeIn } from '@/components/motion'
import { toast } from 'sonner'

interface ServiceRequest {
  id: string
  ticketNumber: string
  orderId: string | null
  order: {
    id: string
    customerName: string
    serviceDueDate: string | null
  } | null
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postcode: string
  serviceType: string
  productName: string | null
  purchaseDate: string | null
  issueDescription: string
  preferredDate: string | null
  status: string
  priority: string
  assignedTo: string | null
  internalNotes: string | null
  resolution: string | null
  scheduledDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Wrench },
  SCHEDULED: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: X },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-600' },
}

const serviceTypeLabels: Record<string, string> = {
  INSTALLATION: 'Installation',
  MAINTENANCE: 'Maintenance',
  REPAIR: 'Repair',
  FILTER_REPLACEMENT: 'Filter Replacement',
  INSPECTION: 'Inspection',
  WARRANTY_CLAIM: 'Warranty Claim',
  OTHER: 'Other',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}

function formatDateOnly(dateStr: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
  }).format(new Date(dateStr))
}

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    scheduledDate: '',
    internalNotes: '',
    resolution: '',
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/service-requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching service requests:', error)
      toast.error('Failed to load service requests')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (request: ServiceRequest) => {
    setEditingId(request.id)
    setEditForm({
      status: request.status,
      priority: request.priority,
      assignedTo: request.assignedTo || '',
      scheduledDate: request.scheduledDate ? request.scheduledDate.split('T')[0] : '',
      internalNotes: request.internalNotes || '',
      resolution: request.resolution || '',
    })
    setExpandedId(request.id)
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        const updated = await res.json()
        setRequests(prev => prev.map(r => r.id === id ? updated : r))
        setEditingId(null)
        toast.success('Service request updated')
      } else {
        toast.error('Failed to update service request')
      }
    } catch {
      toast.error('Failed to update service request')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service request?')) return

    try {
      const res = await fetch(`/api/admin/service-requests/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id))
        toast.success('Service request deleted')
      } else {
        toast.error('Failed to delete service request')
      }
    } catch {
      toast.error('Failed to delete service request')
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    scheduled: requests.filter(r => r.status === 'SCHEDULED').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
  }

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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Service Requests</h1>
          <p className="text-slate-500 mt-1">Manage and track customer service requests</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-slate-500">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.scheduled}</p>
              <p className="text-sm text-slate-500">Scheduled</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ticket, name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Requests List */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Requests ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No service requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const isExpanded = expandedId === request.id
                  const isEditing = editingId === request.id
                  const statusInfo = statusConfig[request.status] || statusConfig.PENDING
                  const priorityInfo = priorityConfig[request.priority] || priorityConfig.NORMAL
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={request.id}
                      className="border border-blue-100 rounded-xl overflow-hidden"
                    >
                      {/* Header Row */}
                      <div 
                        className="p-4 hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : request.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-mono font-semibold text-blue-600">
                                  {request.ticketNumber}
                                </p>
                                <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                                {request.order && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Order Linked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mt-0.5">{request.name}</p>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-3">
                            <Badge variant="outline" className="bg-slate-50">
                              {serviceTypeLabels[request.serviceType]}
                            </Badge>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 hidden lg:block">
                              {formatDate(request.createdAt)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Mobile badges */}
                        <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="bg-slate-50 text-xs">
                            {serviceTypeLabels[request.serviceType]}
                          </Badge>
                          <Badge className={`${statusInfo.color} text-xs`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-blue-100 bg-slate-50 p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Customer Information
                              </h4>
                              <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-400" />
                                  {request.name}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                                    {request.email}
                                  </a>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                  <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                                    {request.phone}
                                  </a>
                                </p>
                                <p className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                  <span>
                                    {request.address}<br />
                                    {request.city}, {request.state} {request.postcode}
                                  </span>
                                </p>
                              </div>

                              {/* Product Info */}
                              {(request.productName || request.purchaseDate || request.order) && (
                                <div>
                                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    Product & Order Information
                                  </h4>
                                  <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                                    {request.order && (
                                      <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-500">Order:</span>
                                        <Link 
                                          href={`/admin/orders/${request.order.id}`}
                                          className="font-mono text-blue-600 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          #{request.order.id.slice(0, 8).toUpperCase()}
                                        </Link>
                                        {request.order.serviceDueDate && (
                                          <span className="text-xs text-slate-400 ml-2">
                                            (Next service: {formatDateOnly(request.order.serviceDueDate)})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {request.productName && (
                                      <p><span className="text-slate-500">Product:</span> {request.productName}</p>
                                    )}
                                    {request.purchaseDate && (
                                      <p><span className="text-slate-500">Purchased:</span> {formatDateOnly(request.purchaseDate)}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Issue Description */}
                              <div>
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                                  <AlertCircle className="h-4 w-4 text-blue-600" />
                                  Issue Description
                                </h4>
                                <div className="bg-white rounded-lg p-4 text-sm text-slate-600">
                                  {request.issueDescription}
                                </div>
                              </div>

                              {request.preferredDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="text-slate-500">Preferred Date:</span>
                                  <span className="font-medium">{formatDateOnly(request.preferredDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Management Section */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-blue-600" />
                                Manage Request
                              </h4>
                              
                              {isEditing ? (
                                <div className="bg-white rounded-lg p-4 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Status</Label>
                                      <Select 
                                        value={editForm.status} 
                                        onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v }))}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PENDING">Pending</SelectItem>
                                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                          <SelectItem value="COMPLETED">Completed</SelectItem>
                                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Priority</Label>
                                      <Select 
                                        value={editForm.priority} 
                                        onValueChange={(v) => setEditForm(prev => ({ ...prev, priority: v }))}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="LOW">Low</SelectItem>
                                          <SelectItem value="NORMAL">Normal</SelectItem>
                                          <SelectItem value="HIGH">High</SelectItem>
                                          <SelectItem value="URGENT">Urgent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Assigned To</Label>
                                    <Input
                                      value={editForm.assignedTo}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                                      placeholder="Technician name"
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Scheduled Date</Label>
                                    <Input
                                      type="date"
                                      value={editForm.scheduledDate}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Internal Notes</Label>
                                    <Textarea
                                      value={editForm.internalNotes}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                                      placeholder="Notes for internal use..."
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Resolution</Label>
                                    <Textarea
                                      value={editForm.resolution}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                                      placeholder="How was the issue resolved?"
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      onClick={() => handleSave(request.id)}
                                      disabled={saving}
                                      className="flex-1"
                                    >
                                      {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Save className="h-4 w-4 mr-2" />
                                          Save Changes
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-4 space-y-3">
                                  {request.assignedTo && (
                                    <p className="text-sm">
                                      <span className="text-slate-500">Assigned to:</span>{' '}
                                      <span className="font-medium">{request.assignedTo}</span>
                                    </p>
                                  )}
                                  {request.scheduledDate && (
                                    <p className="text-sm">
                                      <span className="text-slate-500">Scheduled:</span>{' '}
                                      <span className="font-medium">{formatDateOnly(request.scheduledDate)}</span>
                                    </p>
                                  )}
                                  {request.internalNotes && (
                                    <div className="text-sm">
                                      <p className="text-slate-500 mb-1">Internal Notes:</p>
                                      <p className="bg-yellow-50 p-2 rounded text-slate-600">{request.internalNotes}</p>
                                    </div>
                                  )}
                                  {request.resolution && (
                                    <div className="text-sm">
                                      <p className="text-slate-500 mb-1">Resolution:</p>
                                      <p className="bg-green-50 p-2 rounded text-slate-600">{request.resolution}</p>
                                    </div>
                                  )}
                                  {request.completedAt && (
                                    <p className="text-sm text-green-600">
                                      Completed: {formatDate(request.completedAt)}
                                    </p>
                                  )}

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(request)
                                      }}
                                      className="flex-1"
                                    >
                                      <Wrench className="h-4 w-4 mr-2" />
                                      Manage
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(request.id)
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Timeline Info */}
                              <div className="text-xs text-slate-500 space-y-1">
                                <p>Created: {formatDate(request.createdAt)}</p>
                                <p>Last Updated: {formatDate(request.updatedAt)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
