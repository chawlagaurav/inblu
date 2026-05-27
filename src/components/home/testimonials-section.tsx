'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { FadeInOnScroll } from '@/components/motion'
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
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
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
      </div>

      {/* Scrolling testimonials container */}
      <div className="mt-12 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="flex hover:pause-animation">
            {/* First set */}
            <div className="flex shrink-0 animate-testimonials-scroll">
              {testimonials.map((testimonial, index) => (
                <div key={`first-${testimonial.id}-${index}`} className="shrink-0 w-[350px] px-3">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
            {/* Second set (duplicate for seamless loop) */}
            <div className="flex shrink-0 animate-testimonials-scroll" aria-hidden="true">
              {testimonials.map((testimonial, index) => (
                <div key={`second-${testimonial.id}-${index}`} className="shrink-0 w-[350px] px-3">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full bg-blue-50/50 border-blue-100">
      <CardContent className="p-6 flex flex-col h-full min-h-[280px]">
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
        
        <Quote className="h-8 w-8 text-blue-200 mb-4" />
        
        <p className="flex-1 text-slate-700 text-sm leading-relaxed line-clamp-4">
          {testimonial.review}
        </p>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-blue-100">
          <Avatar>
            {testimonial.imageUrl ? (
              <AvatarImage src={testimonial.imageUrl} alt={testimonial.name} />
            ) : null}
            <AvatarFallback className="bg-blue-200 text-blue-700">
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
