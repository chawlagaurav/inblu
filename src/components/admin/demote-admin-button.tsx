'use client'

/**
 * Row-level "Demote" button for the Admins list. Server-rendered rows can't
 * hold the click handler + confirm + router.refresh in one place, so we split
 * the action out into this small client component that the page instantiates
 * once per demotable row.
 *
 * The parent decides which rows get a button — the super-admin's own row and
 * the SUPER_ADMIN row are omitted at the page level, so this component just
 * runs the action.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DemoteAdminButtonProps {
  id: string
  email: string
  name: string | null
}

export function DemoteAdminButton({ id, email, name }: DemoteAdminButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handleDemote = async () => {
    const label = name || email
    if (!confirm(
      `Demote ${label} to a normal customer? They'll lose all admin access, be signed out of any active sessions, and their account will become a regular customer account. Their order history is preserved.`,
    )) return

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to demote admin')
        return
      }
      toast.success(`${label} demoted to customer`)
      // Re-render the server component so the row disappears from the list.
      router.refresh()
    } catch {
      toast.error('Failed to demote admin')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDemote}
      disabled={busy}
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <UserMinus className="h-3.5 w-3.5 mr-1.5" />
      )}
      Demote
    </Button>
  )
}
