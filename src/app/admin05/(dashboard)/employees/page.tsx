'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, X, Download, BriefcaseBusiness, Paperclip, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FadeIn } from '@/components/motion'
import {
  EmployeeForm,
  emptyEmployee,
  EMPLOYMENT_STATUS_OPTIONS,
  type EmployeeFormValue,
  type EmploymentStatus,
} from '@/components/admin/employee-form'
import { toast } from 'sonner'

interface EmployeeDoc {
  id: string
  label: string
  url: string
}

interface Employee {
  id: string
  employeeId: string
  fullName: string
  email: string
  phone: string
  address: string | null
  department: string
  position: string
  joiningDate: string
  employmentStatus: EmploymentStatus
  currentStatus: string
  notes: string | null
  bankName: string | null
  accountNumber: string | null
  bsb: string | null
  isActive: boolean
  documents: EmployeeDoc[]
  createdAt: string
  updatedAt: string
}

const employmentStatusLabel = Object.fromEntries(
  EMPLOYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<EmploymentStatus, string>

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeFormValue | undefined>()

  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Per-row action lock. Keyed by employee id, so we can show a spinner on
  // exactly the row whose action is in flight (deactivate / reactivate /
  // delete) and block double-clicks during the round trip.
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (showInactive) params.set('showInactive', 'true')
    // Search is applied client-side too (for instant feedback), but we also
    // forward it in the export URL so the spreadsheet matches the visible list.
    if (search.trim()) params.set('search', search.trim())
    return params.toString()
  }, [search, showInactive])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showInactive) params.set('showInactive', 'true')
      const res = await fetch(`/api/admin/employees?${params.toString()}`)
      if (!res.ok) {
        toast.error('Failed to load employees')
        return
      }
      const data = await res.json()
      setEmployees(data)
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const hay = [
        e.employeeId,
        e.fullName,
        e.email,
        e.phone,
        e.department,
        e.position,
        e.currentStatus,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [employees, search])

  const openCreate = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }

  const openEdit = (e: Employee) => {
    setEditing({
      id: e.id,
      employeeId: e.employeeId,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
      address: e.address ?? '',
      department: e.department,
      position: e.position,
      joiningDate: e.joiningDate.split('T')[0],
      employmentStatus: e.employmentStatus,
      currentStatus: e.currentStatus,
      notes: e.notes ?? '',
      bankName: e.bankName ?? '',
      accountNumber: e.accountNumber ?? '',
      bsb: e.bsb ?? '',
      documents: e.documents.map((d) => ({ id: d.id, label: d.label, url: d.url })),
    })
    setDialogOpen(true)
  }

  // Soft delete — flip isActive=false. The list view is always single-state
  // (active-only OR inactive-only), so deactivating a row always removes it
  // from the current view, regardless of which view we're on.
  const handleDeactivate = async (e: Employee) => {
    if (!confirm(
      `Deactivate ${e.fullName}? Their record stays in the system for audit but won't appear in the default list. Toggle "Show inactive" to find them again.`,
    )) return
    setBusyId(e.id)
    try {
      const res = await fetch(`/api/admin/employees/${e.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to deactivate employee')
        return
      }
      setEmployees((prev) => prev.filter((row) => row.id !== e.id))
      toast.success('Employee deactivated')
    } catch {
      toast.error('Failed to deactivate employee')
    } finally {
      setBusyId(null)
    }
  }

  // Reactivate flips isActive back to true. Removes the row from the current
  // (inactive-only) view since it no longer matches.
  const handleReactivate = async (e: Employee) => {
    setBusyId(e.id)
    try {
      const res = await fetch(`/api/admin/employees/${e.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to reactivate employee')
        return
      }
      setEmployees((prev) => prev.filter((row) => row.id !== e.id))
      toast.success('Employee reactivated. Toggle "Show inactive" off to see them in the active list.')
    } catch {
      toast.error('Failed to reactivate employee')
    } finally {
      setBusyId(null)
    }
  }

  // Permanent delete is only available on already-inactive rows. The server
  // enforces this too (409 if you try on an active employee).
  const handlePermanentDelete = async (e: Employee) => {
    if (!confirm(
      `Permanently delete ${e.fullName}? This wipes the employee record AND all attached documents from the database. This cannot be undone.`,
    )) return
    setBusyId(e.id)
    try {
      const res = await fetch(`/api/admin/employees/${e.id}/permanent`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to delete employee')
        return
      }
      setEmployees((prev) => prev.filter((row) => row.id !== e.id))
      toast.success('Employee permanently deleted')
    } catch {
      toast.error('Failed to delete employee')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="text-slate-500 mt-1">
              Manage your team — staff records, departments, and documents.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={`/api/admin/employees/export?${queryString}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </a>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.05}>
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, email, department, position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 whitespace-nowrap">Show inactive</span>
            </label>
          </CardContent>
        </Card>
      </FadeIn>

      {/* List */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <BriefcaseBusiness className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                {employees.length === 0 ? (
                  showInactive ? (
                    <>
                      <p>No inactive employees</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Deactivated employees show up here. Toggle &quot;Show inactive&quot; off to see your active team.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>No employees yet</p>
                      <p className="text-sm text-slate-400 mt-1">Click &quot;Add Employee&quot; to create the first record</p>
                    </>
                  )
                ) : (
                  <p>No employees match your search</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5">Employee ID</th>
                      <th className="text-left px-4 py-2.5">Full Name</th>
                      <th className="text-left px-4 py-2.5">Email</th>
                      <th className="text-left px-4 py-2.5">Phone</th>
                      <th className="text-left px-4 py-2.5">Department</th>
                      <th className="text-left px-4 py-2.5">Position</th>
                      <th className="text-left px-4 py-2.5">Joined</th>
                      <th className="text-left px-4 py-2.5">Employment</th>
                      <th className="text-left px-4 py-2.5">Current Status</th>
                      <th className="text-left px-4 py-2.5">Docs</th>
                      <th className="text-right px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr
                        key={e.id}
                        className={`border-t border-slate-100 hover:bg-slate-50 ${e.isActive ? '' : 'opacity-60'}`}
                      >
                        <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">{e.employeeId}</td>
                        <td className="px-4 py-3 text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{e.fullName}</span>
                            {!e.isActive && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          {e.address && (
                            <div className="text-xs text-slate-400 truncate max-w-xs" title={e.address}>
                              {e.address}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <a href={`mailto:${e.email}`} className="hover:text-blue-600 hover:underline">
                            {e.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <a href={`tel:${e.phone}`} className="hover:text-blue-600 hover:underline">
                            {e.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{e.department}</td>
                        <td className="px-4 py-3 text-slate-700">{e.position}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(e.joiningDate)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{employmentStatusLabel[e.employmentStatus]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{e.currentStatus}</td>
                        <td className="px-4 py-3">
                          {e.documents.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600" title={e.documents.map((d) => d.label).join(', ')}>
                              <Paperclip className="h-3.5 w-3.5" />
                              {e.documents.length}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {/* Action set depends on the row's state.
                              Active   → Edit + Deactivate (soft delete).
                              Inactive → Reactivate + Permanent delete. Edit is
                                         intentionally hidden because editing
                                         an inactive record is rarely useful and
                                         risks reviving "ghost" employees by
                                         accident; reactivate first, then edit. */}
                          <div className="flex items-center justify-end gap-1">
                            {busyId === e.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />
                            ) : e.isActive ? (
                              <>
                                <button
                                  onClick={() => openEdit(e)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                  aria-label="Edit"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeactivate(e)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                  aria-label="Deactivate"
                                  title="Deactivate"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleReactivate(e)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                  aria-label="Reactivate"
                                  title="Reactivate"
                                >
                                  <Power className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(e)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                  aria-label="Delete permanently"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initial={editing ?? emptyEmployee}
            onSubmit={(saved) => {
              setDialogOpen(false)
              // Merge the saved row in place instead of refetching the whole
              // list. The form hands back a server-shaped employee (including
              // its current documents), so we can update / prepend without a
              // round-trip. The list is single-state (active-only OR
              // inactive-only), so we only merge in rows whose isActive
              // matches the current view — otherwise the row would appear
              // in a list where it doesn't belong.
              if (saved && typeof saved === 'object' && 'id' in saved) {
                const row = saved as Employee
                const matchesView = row.isActive === !showInactive
                setEmployees((prev) => {
                  const withoutRow = prev.filter((p) => p.id !== row.id)
                  if (!matchesView) return withoutRow
                  const existed = prev.some((p) => p.id === row.id)
                  return existed ? withoutRow.concat(row) : [row, ...withoutRow]
                })
              } else {
                // Fallback if for any reason the form didn't return a row.
                fetchEmployees()
              }
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
