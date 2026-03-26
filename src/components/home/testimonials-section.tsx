'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { Testimonial } from '@/types'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  // Don't render section if no testimonials
  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Don&apos;t just take our word for it – hear from our satisfied customers across Australia.
            </p>
          </div>
        </FadeInOnScroll>

        <StaggerContainer className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <TestimonialCard testimonial={testimonial} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full bg-sky-50/50 border-sky-100">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < testimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300'
              }`}
            />
          ))}
        </div>
        
        <Quote className="h-8 w-8 text-sky-200 mb-4" />
        
        <p className="flex-1 text-slate-700 text-sm leading-relaxed">
          {testimonial.review}
        </p>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-sky-100">
          <Avatar>
            {testimonial.imageUrl ? (
              <AvatarImage src={testimonial.imageUrl} alt={testimonial.name} />
            ) : null}
            <AvatarFallback className="bg-sky-200 text-sky-700">
              {testimonial.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
            <p className="text-xs text-slate-500">Verified Customer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
