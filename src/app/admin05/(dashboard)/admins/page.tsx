import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import prisma from '@/lib/prisma'
import { verifySuperAdmin } from '@/lib/admin-auth'
import { AddAdminDialog } from '@/components/admin/add-admin-dialog'
import { DemoteAdminButton } from '@/components/admin/demote-admin-button'

export const metadata: Metadata = {
  title: 'Admins - Admin',
  description: 'Manage admin users',
}

// Defense in depth: even though the sidebar hides this page from non-super
// admins, we re-check on the server. Sidebar hiding is UX, not authorization.
export default async function AdminAdminsPage() {
  const superAdmin = await verifySuperAdmin()
  if (!superAdmin) {
    redirect('/admin05')
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    // Super admin surfaces first, then admins by oldest first.
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
              Admins
            </h1>
            <p className="text-slate-500 mt-1">
              Manage who has admin access. Only the super admin can add new admins.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AddAdminDialog />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle>Admin List ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Added</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    // A row is demotable when it's a plain ADMIN (not the
                    // SUPER_ADMIN row) AND it isn't the current viewer. The
                    // API enforces the same rules — this is UX-only.
                    const canDemote = a.role === 'ADMIN' && a.id !== superAdmin.id
                    return (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 text-slate-900">{a.name || <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-3 text-slate-700">{a.email}</td>
                        <td className="px-4 py-3">
                          {a.role === 'SUPER_ADMIN' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              Admin
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {canDemote ? (
                            <DemoteAdminButton id={a.id} email={a.email} name={a.name} />
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
