'use client'

import { ArrowRight, Home } from 'lucide-react'
import { FadeInOnScroll } from '@/components/motion'

export function PartnerSection() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-12 sm:px-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Home className="h-7 w-7 text-blue-300" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Complete Your Home Upgrade
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Great water is just one part of a better home.
              </p>
              <p className="mt-3 text-base text-slate-400">
                Looking to improve your home&apos;s security, comfort and functionality? Our trusted
                partner, Stellar Home Solutions, offers smart locks, security solutions and a range
                of home improvement services.
              </p>
              <a
                href="https://www.stellarhomesols.com.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-blue-50"
              >
                Explore Stellar Home Solutions
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
