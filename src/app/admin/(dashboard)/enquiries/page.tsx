'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2, MessageSquare, Trash2, Search, X, Mail, Phone, ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { FadeIn } from '@/components/motion'

interface Enquiry {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: string
  resolvedAt: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  LEAD: { label: 'Lead', color: 'bg-purple-100 text-purple-700' },
  CONVERTED: { label: 'Converted to Sale', color: 'bg-green-100 text-green-700' },
  RESOLVED: { label: 'Resolved', color: 'bg-slate-100 text-slate-600' },
}

const statuses = ['NEW', 'IN_PROGRESS', 'LEAD', 'CONVERTED', 'RESOLVED'] as const

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function daysUntilDeletion(resolvedAt: string) {
  const resolved = new Date(resolvedAt).getTime()
  const deleteAt = resolved + 5 * 24 * 60 * 60 * 1000
  const remaining = Math.ceil((deleteAt - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      const res = await fetch('/api/admin/enquiries')
      if (res.ok) {
        setEnquiries(await res.json())
      }
    } catch {
      toast.error('Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setEnquiries(prev => prev.map(e => e.id === id ? updated : e))
        if (selectedEnquiry?.id === id) setSelectedEnquiry(updated)
        toast.success(`Status updated to ${statusConfig[newStatus].label}`)
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this enquiry? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEnquiries(prev => prev.filter(e => e.id !== id))
        if (selectedEnquiry?.id === id) setSelectedEnquiry(null)
        toast.success('Enquiry deleted')
      }
    } catch {
      toast.error('Failed to delete enquiry')
    }
  }

  const filtered = useMemo(() => {
    let result = [...enquiries]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        e => e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter)
    }
    return result
  }, [enquiries, search, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enquiries.length }
    statuses.forEach(s => { counts[s] = enquiries.filter(e => e.status === s).length })
    return counts
  }, [enquiries])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Enquiries</h1>
          <p className="text-slate-500 mt-1">
            Manage customer enquiries from the contact form &middot; {filtered.length} enquir{filtered.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </FadeIn>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'NEW', label: 'New' },
          { key: 'IN_PROGRESS', label: 'In Progress' },
          { key: 'LEAD', label: 'Lead' },
          { key: 'CONVERTED', label: 'Converted' },
          { key: 'RESOLVED', label: 'Resolved' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}>
            <Badge
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 transition-colors"
            >
              {tab.label} ({statusCounts[tab.key] || 0})
            </Badge>
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <CardTitle className="text-lg">
              {statusFilter !== 'all' ? `${statusConfig[statusFilter]?.label} Enquiries` : 'All Enquiries'}
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, subject..."
                className="pl-10 pr-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No enquiries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(enquiry => (
                <div
                  key={enquiry.id}
                  className="border border-sky-100 rounded-xl p-4 hover:bg-sky-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === enquiry.id ? null : enquiry.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{enquiry.name}</span>
                        <Badge className={statusConfig[enquiry.status]?.color}>
                          {statusConfig[enquiry.status]?.label}
                        </Badge>
                        {enquiry.status === 'RESOLVED' && enquiry.resolvedAt && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Deletes in {daysUntilDeletion(enquiry.resolvedAt)}d
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 font-medium mt-0.5">{enquiry.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {enquiry.email}
                        </span>
                        {enquiry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {enquiry.phone}
                          </span>
                        )}
                        <span>{formatDate(enquiry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="text-sky-600"
                      >
                        Tag
                      </Button>
                      <button
                        onClick={() => handleDelete(enquiry.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === enquiry.id ? null : enquiry.id)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {expandedId === enquiry.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded message */}
                  {expandedId === enquiry.id && (
                    <div className="mt-3 pt-3 border-t border-sky-100">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{enquiry.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {statuses.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(enquiry.id, s)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              enquiry.status === s
                                ? statusConfig[s].color + ' ring-2 ring-offset-1 ring-sky-300'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag / Status Dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="font-medium text-slate-900">{selectedEnquiry.name}</p>
                <p className="text-sm text-slate-500">{selectedEnquiry.subject}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      handleStatusChange(selectedEnquiry.id, s)
                      setSelectedEnquiry(null)
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedEnquiry.status === s
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig[s].color}>{statusConfig[s].label}</Badge>
                    </div>
                    {selectedEnquiry.status === s && (
                      <span className="text-xs text-sky-600 font-medium">Current</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
