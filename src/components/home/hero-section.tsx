'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Droplets, Shield, Truck } from 'lucide-react'

// ============================================================
// CONFIGURATION - Change this path to update hero background
// ============================================================
const HERO_BG_IMAGE = '/hero-bg.png'

// ============================================================
// HERO SECTION - Fullscreen Background Style
// ============================================================
export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Fullscreen Background Image */}
      <div className="absolute inset-0">
        <Image
          src={HERO_BG_IMAGE}
          alt="Hero background"
          fill
          priority
          quality={90}
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Dark Overlay - 40% */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20">
            <Droplets className="h-4 w-4 text-blue-400" />
            Premium Water Filtration
          </span>
        </motion.div>

        {/* Big Bold Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase text-white leading-[1.1] max-w-4xl mx-auto"
          style={{ fontFamily: 'Inter, Poppins, system-ui, sans-serif' }}
        >
          DEFINING
          <span className="block text-blue-400">PURITY.</span>
        </motion.h1>

        {/* Supporting Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
        >
          Advanced RO purifiers & water ionisers engineered for Australian homes.
          Crystal-clear water, delivered to your doorstep.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA */}
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold uppercase tracking-wider text-white bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
            >
              Shop Now
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Animated Water Drop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Water Drop SVG - Transparent with white border */}
            <svg
              width="32"
              height="44"
              viewBox="0 0 32 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2C16 2 2 18 2 28C2 35.732 8.26801 42 16 42C23.732 42 30 35.732 30 28C30 18 16 2 16 2Z"
                fill="transparent"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.7"
              />
            </svg>
            {/* Ripple effect */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/20 rounded-full blur-sm"
            />
          </motion.div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/70"
        >
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-400" />
            <span>Free Australia-wide Shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>2-Year Warranty</span>
          </div>
        </motion.div>
      </div>

    </section>
  )
}
