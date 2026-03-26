import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Star, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Testimonials - Admin',
  description: 'Manage customer testimonials',
}

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const approvedCount = testimonials.filter((t) => t.isApproved).length
  const pendingCount = testimonials.filter((t) => !t.isApproved).length

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Testimonials</h1>
            <p className="text-slate-500 mt-1">
              Manage customer reviews and testimonials ({approvedCount} approved, {pendingCount} pending)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/testimonials/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Link>
          </Button>
        </div>
      </FadeIn>

      {testimonials.length === 0 ? (
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">No testimonials yet.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/testimonials/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Testimonial
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid gap-6">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{testimonial.authorName}</h3>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant={testimonial.isApproved ? 'default' : 'secondary'}>
                          {testimonial.isApproved ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-slate-600">{testimonial.content}</p>
                      <p className="text-sm text-slate-400 mt-2">{formatDate(testimonial.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
