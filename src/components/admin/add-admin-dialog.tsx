'use client'

/**
 * Dialog used by the super-admin to add a new admin. Posts { email, name? } to
 * /api/admin/admins; on success the API creates the Supabase Auth user with a
 * random password and emails an invite/reset link, so no plaintext password
 * ever appears in the UI.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function AddAdminDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setEmail('')
    setName('')
    setSaving(false)
  }

  const handleSubmit = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Enter a valid email')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, name: name.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to add admin')
        return
      }
      toast.success(
        name.trim()
          ? `Invite sent — ${name.trim()} will receive a password-set email`
          : 'Invite sent — the new admin will receive a password-set email',
      )
      setOpen(false)
      reset()
      // Re-render the server component with the new row.
      router.refresh()
    } catch {
      toast.error('Failed to add admin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Admin
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Admin
          </DialogTitle>
          <DialogDescription>
            The new admin will receive an email with a link to set their own password.
            You never need to type or share a password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="new_admin_email">Email *</Label>
            <Input
              id="new_admin_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@inblu.com.au"
              className="mt-1"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="new_admin_name">Full name (optional)</Label>
            <Input
              id="new_admin_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending invite...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add & send invite
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
