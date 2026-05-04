'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2, MessageSquare, Trash2, Search, X, Mail, Phone, ChevronDown, ChevronUp, MessageCircle, Clock,
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
  comment: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW_LEAD: { label: 'New Lead', color: 'bg-blue-100 text-blue-700' },
  INTERESTED: { label: 'Interested', color: 'bg-cyan-100 text-cyan-700' },
  FOLLOW_UP: { label: 'Follow-up', color: 'bg-yellow-100 text-yellow-700' },
  NEED_MORE_INFO: { label: 'Need More Info', color: 'bg-orange-100 text-orange-700' },
  QUOTATION_SENT: { label: 'Quotation Sent', color: 'bg-purple-100 text-purple-700' },
  NEGOTIATION: { label: 'Negotiation', color: 'bg-indigo-100 text-indigo-700' },
  CONVERTED_TO_ORDER: { label: 'Converted to Order', color: 'bg-green-100 text-green-700' },
  NO_RESPONSE: { label: 'No Response', color: 'bg-slate-100 text-slate-600' },
  NOT_INTERESTED: { label: 'Not Interested', color: 'bg-red-100 text-red-700' },
  LOST: { label: 'Lost', color: 'bg-red-200 text-red-800' },
  FUTURE_FOLLOW_UP: { label: 'Future Follow-up', color: 'bg-teal-100 text-teal-700' },
}

const statuses = ['NEW_LEAD', 'INTERESTED', 'FOLLOW_UP', 'NEED_MORE_INFO', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED_TO_ORDER', 'NO_RESPONSE', 'NOT_INTERESTED', 'LOST', 'FUTURE_FOLLOW_UP'] as const

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
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

  const handleCommentUpdate = async (id: string, comment: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })
      if (res.ok) {
        const updated = await res.json()
        setEnquiries(prev => prev.map(e => e.id === id ? updated : e))
        if (selectedEnquiry?.id === id) setSelectedEnquiry(updated)
        toast.success('Comment updated')
      }
    } catch {
      toast.error('Failed to update comment')
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          { key: 'NEW_LEAD', label: 'New Lead' },
          { key: 'INTERESTED', label: 'Interested' },
          { key: 'FOLLOW_UP', label: 'Follow-up' },
          { key: 'NEED_MORE_INFO', label: 'Need More Info' },
          { key: 'QUOTATION_SENT', label: 'Quotation Sent' },
          { key: 'NEGOTIATION', label: 'Negotiation' },
          { key: 'CONVERTED_TO_ORDER', label: 'Converted' },
          { key: 'NO_RESPONSE', label: 'No Response' },
          { key: 'NOT_INTERESTED', label: 'Not Interested' },
          { key: 'LOST', label: 'Lost' },
          { key: 'FUTURE_FOLLOW_UP', label: 'Future Follow-up' },
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
                  className="border border-blue-100 rounded-xl p-4 hover:bg-blue-50/50 transition-colors"
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
                        {enquiry.comment && (
                          <span className="flex items-center gap-1 text-xs text-blue-500" title="Has comment">
                            <MessageCircle className="h-3 w-3" />
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
                        {enquiry.updatedAt !== enquiry.createdAt && (
                          <span className="flex items-center gap-1 text-blue-500" title={`Last updated: ${formatDate(enquiry.updatedAt)}`}>
                            <Clock className="h-3 w-3" /> Updated {formatDate(enquiry.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="text-blue-600"
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
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{enquiry.message}</p>
                      
                      {/* Comment Box */}
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Notes / Comment</label>
                        <textarea
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none bg-white"
                          rows={2}
                          placeholder="Add notes about this enquiry..."
                          defaultValue={enquiry.comment || ''}
                          onBlur={(e) => {
                            const newComment = e.target.value.trim()
                            if (newComment !== (enquiry.comment || '')) {
                              handleCommentUpdate(enquiry.id, newComment)
                            }
                          }}
                        />
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {statuses.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(enquiry.id, s)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              enquiry.status === s
                                ? statusConfig[s].color + ' ring-2 ring-offset-1 ring-blue-300'
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig[s].color}>{statusConfig[s].label}</Badge>
                    </div>
                    {selectedEnquiry.status === s && (
                      <span className="text-xs text-blue-600 font-medium">Current</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Comment Box */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comment / Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  rows={3}
                  placeholder="Add a comment or note about this enquiry..."
                  defaultValue={selectedEnquiry.comment || ''}
                  onBlur={(e) => {
                    const newComment = e.target.value.trim()
                    if (newComment !== (selectedEnquiry.comment || '')) {
                      handleCommentUpdate(selectedEnquiry.id, newComment)
                    }
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
