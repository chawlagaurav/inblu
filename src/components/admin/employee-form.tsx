'use client'

/**
 * Reusable form for adding + editing an Employee.
 *
 * Docs flow: documents must be attached AFTER an employee record exists
 * (the metadata table requires an employeeId). Concretely:
 *   - Edit flow: the employee already exists, so adding/removing docs is an
 *     immediate sub-API call (POST or DELETE under /employees/[id]/documents).
 *   - Add flow: we let the admin "queue" docs in local state with the
 *     uploaded Cloudinary URL already in hand, then on Save we first POST
 *     the employee, then POST each queued doc against the new employee's id.
 *     If a doc fails to attach, the employee still saves — we just toast
 *     the failure rather than rolling everything back.
 */

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DocumentUpload } from '@/components/admin/image-upload'
import { toast } from 'sonner'

export type EmploymentStatus = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'CASUAL'

export const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CASUAL', label: 'Casual' },
]

export interface EmployeeDoc {
  id: string         // server doc id, or a temporary local id for unsaved (Add-flow) docs
  label: string
  url: string
  /** True for entries the admin added during the Add flow but haven't been
   *  POSTed yet. These get created after the employee row exists on Save. */
  isPending?: boolean
}

export interface EmployeeFormValue {
  id?: string                // present when editing
  employeeId: string
  fullName: string
  email: string
  phone: string
  address: string
  department: string
  position: string
  joiningDate: string        // YYYY-MM-DD
  employmentStatus: EmploymentStatus
  currentStatus: string
  notes: string
  // Bank details (optional).
  bankName: string
  accountNumber: string
  bsb: string
  documents: EmployeeDoc[]
}

export const emptyEmployee: EmployeeFormValue = {
  employeeId: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  department: '',
  position: '',
  joiningDate: new Date().toISOString().split('T')[0],
  employmentStatus: 'FULL_TIME',
  currentStatus: 'Active',
  notes: '',
  bankName: '',
  accountNumber: '',
  bsb: '',
  documents: [],
}

interface EmployeeFormProps {
  initial?: EmployeeFormValue
  /** Called after a successful save. The server-shaped employee row is passed
   *  back so the parent list can merge it in place without refetching. */
  onSubmit: (saved?: unknown) => void
  onCancel?: () => void
}

export function EmployeeForm({ initial, onSubmit, onCancel }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeFormValue>(initial ?? emptyEmployee)
  const [saving, setSaving] = useState(false)

  // New-doc widget state — used to capture {label, url} before attaching.
  const [newDocLabel, setNewDocLabel] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const handleAddDocument = async () => {
    const label = newDocLabel.trim()
    const url = newDocUrl.trim()
    if (!label) {
      toast.error('Enter a label for the document')
      return
    }
    if (!url) {
      toast.error('Upload a file first')
      return
    }

    if (form.id) {
      // Edit flow — attach immediately so the user sees a confirmed entry.
      try {
        const res = await fetch(`/api/admin/employees/${form.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, url }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to attach document')
          return
        }
        setForm((prev) => ({
          ...prev,
          documents: [...prev.documents, { id: data.id, label, url }],
        }))
        setNewDocLabel('')
        setNewDocUrl('')
      } catch {
        toast.error('Failed to attach document')
      }
    } else {
      // Add flow — queue locally with a temp id; we'll attach after the
      // employee record gets created on Save.
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setForm((prev) => ({
        ...prev,
        documents: [...prev.documents, { id: tempId, label, url, isPending: true }],
      }))
      setNewDocLabel('')
      setNewDocUrl('')
    }
  }

  const handleRemoveDocument = async (doc: EmployeeDoc) => {
    if (doc.isPending || !form.id) {
      // Either a queued (not-yet-attached) doc in the Add flow, or — should
      // not happen — a non-pending doc with no parent id. Either way: local
      // removal only.
      setForm((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== doc.id),
      }))
      return
    }
    try {
      const res = await fetch(`/api/admin/employees/${form.id}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to remove document')
        return
      }
      setForm((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== doc.id),
      }))
    } catch {
      toast.error('Failed to remove document')
    }
  }

  const handleSave = async () => {
    // Quick required-field check so we don't bounce off the server for an
    // empty field.
    const requiredEmpty: string | null =
      !form.employeeId.trim() ? 'Employee ID is required'
        : !form.fullName.trim() ? 'Full name is required'
        : !form.email.trim() ? 'Email is required'
        : !form.phone.trim() ? 'Phone number is required'
        : !form.department.trim() ? 'Department is required'
        : !form.position.trim() ? 'Position is required'
        : !form.joiningDate ? 'Joining date is required'
        : !form.currentStatus.trim() ? 'Current status is required'
        : null
    if (requiredEmpty) {
      toast.error(requiredEmpty)
      return
    }

    setSaving(true)
    try {
      const url = form.id ? `/api/admin/employees/${form.id}` : '/api/admin/employees'
      const method = form.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: form.employeeId,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address || null,
          department: form.department,
          position: form.position,
          joiningDate: form.joiningDate,
          employmentStatus: form.employmentStatus,
          currentStatus: form.currentStatus,
          notes: form.notes || null,
          bankName: form.bankName || null,
          accountNumber: form.accountNumber || null,
          bsb: form.bsb || null,
        }),
      })
      const saved = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(saved.error || 'Failed to save employee')
        return
      }

      // Flush queued docs (Add flow only — Edit flow attaches them inline).
      // After flushing we re-fetch the employee once so we hand a row back to
      // the parent that already includes the freshly-attached docs; otherwise
      // the parent would render an employee with empty `documents` until its
      // next list refresh.
      let result = saved
      if (!form.id) {
        const pending = form.documents.filter((d) => d.isPending)
        for (const doc of pending) {
          const r = await fetch(`/api/admin/employees/${saved.id}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: doc.label, url: doc.url }),
          })
          if (!r.ok) {
            toast.error(`Saved employee, but failed to attach "${doc.label}"`)
          }
        }
        if (pending.length > 0) {
          const refetch = await fetch(`/api/admin/employees/${saved.id}`)
          if (refetch.ok) result = await refetch.json()
        }
      }

      toast.success(form.id ? 'Employee updated' : 'Employee added')
      onSubmit(result)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="emp_id">Employee ID *</Label>
          <Input
            id="emp_id"
            value={form.employeeId}
            onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
            placeholder="e.g. EMP-001"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="emp_name">Full Name *</Label>
          <Input
            id="emp_name"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="emp_email">Email *</Label>
          <Input
            id="emp_email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="emp_phone">Contact Number *</Label>
          <Input
            id="emp_phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="emp_address">Address</Label>
        <Textarea
          id="emp_address"
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          rows={2}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="emp_department">Department *</Label>
          <Input
            id="emp_department"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="emp_position">Position *</Label>
          <Input
            id="emp_position"
            value={form.position}
            onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="emp_joining">Joining Date *</Label>
          <Input
            id="emp_joining"
            type="date"
            value={form.joiningDate}
            onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="emp_employment">Employment Status *</Label>
          <select
            id="emp_employment"
            value={form.employmentStatus}
            onChange={(e) => setForm((p) => ({ ...p, employmentStatus: e.target.value as EmploymentStatus }))}
            className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="emp_currentStatus">Current Status *</Label>
        <Input
          id="emp_currentStatus"
          value={form.currentStatus}
          onChange={(e) => setForm((p) => ({ ...p, currentStatus: e.target.value }))}
          placeholder="e.g. Active, On leave, Probation"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="emp_notes">Notes</Label>
        <Textarea
          id="emp_notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>

      {/* Bank details — all optional; used for payroll. */}
      <div className="border-t border-slate-100 pt-4">
        <Label>Bank Details</Label>
        <p className="text-xs text-slate-500 mb-2">
          Optional. Used for payroll transfers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="emp_bank_name" className="text-xs">Bank Name</Label>
            <Input
              id="emp_bank_name"
              value={form.bankName}
              onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
              placeholder="e.g. Commonwealth Bank"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emp_account_no" className="text-xs">Account Number</Label>
            <Input
              id="emp_account_no"
              inputMode="numeric"
              value={form.accountNumber}
              onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
              placeholder="e.g. 12345678"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emp_bsb" className="text-xs">BSB</Label>
            <Input
              id="emp_bsb"
              inputMode="numeric"
              value={form.bsb}
              onChange={(e) => setForm((p) => ({ ...p, bsb: e.target.value }))}
              placeholder="e.g. 062-000"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="border-t border-slate-100 pt-4">
        <Label>Documents</Label>
        <p className="text-xs text-slate-500 mb-2">
          Attach labelled files (contracts, ID proof, certifications, etc.). PDF or image up to 10MB each.
        </p>

        {form.documents.length > 0 && (
          <ul className="space-y-2 mb-3">
            {form.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.label}</p>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    View file
                  </a>
                </div>
                {doc.isPending && (
                  <span className="text-xs text-amber-600">Will save with employee</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(doc)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div>
            <Label htmlFor="emp_doc_label" className="text-xs">Document label</Label>
            <Input
              id="emp_doc_label"
              value={newDocLabel}
              onChange={(e) => setNewDocLabel(e.target.value)}
              placeholder="e.g. Employment contract"
              className="mt-1"
            />
          </div>
          <DocumentUpload
            value={newDocUrl}
            onChange={setNewDocUrl}
            folder="employees"
            label="document"
            acceptedFiles="pdf-or-image"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddDocument}
            disabled={!newDocLabel.trim() || !newDocUrl.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Attach document
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : form.id ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </div>
  )
}
