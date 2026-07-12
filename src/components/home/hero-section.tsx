'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Droplets, Shield, Truck } from 'lucide-react'

// Default content (used as fallback)
const DEFAULT_CONTENT = {
  hero_heading: 'DEFINING PURITY.',
  hero_description: 'Advanced RO purifiers & water ionisers engineered for Australian homes. Crystal-clear water, delivered to your doorstep.',
  hero_cta_text: 'Shop Now',
  hero_cta_link: '/products',
  hero_background_image: '/hero-bg.png',
  hero_video_url: '',
}

interface HeroContent {
  hero_heading?: string
  hero_description?: string
  hero_cta_text?: string
  hero_cta_link?: string
  hero_background_image?: string
  hero_video_url?: string
}

// Decide whether this device/connection should load the hero video.
// We skip on Save-Data or 2G to protect users on metered/slow links; everyone
// else (including mobile on 3G/4G/5G/wifi) gets the video.
function shouldLoadVideo(): boolean {
  if (typeof navigator === 'undefined') return false
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn?.saveData) return false
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false
  return true
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [content, setContent] = useState<HeroContent>(DEFAULT_CONTENT)
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [loadVideo, setLoadVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
    queueMicrotask(() => setLoadVideo(shouldLoadVideo()))

    // Fetch hero content from API
    fetch('/api/marketing/hero')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setContent(prev => ({ ...prev, ...data }))
        }
      })
      .catch(err => console.error('Error fetching hero content:', err))
  }, [])

  const bgImage = content.hero_background_image || DEFAULT_CONTENT.hero_background_image
  const videoUrl = content.hero_video_url || ''
  const heading = content.hero_heading || DEFAULT_CONTENT.hero_heading
  const description = content.hero_description || DEFAULT_CONTENT.hero_description
  const ctaText = content.hero_cta_text || DEFAULT_CONTENT.hero_cta_text
  const ctaLink = content.hero_cta_link || DEFAULT_CONTENT.hero_cta_link
  const showVideo = loadVideo && Boolean(videoUrl)

  // Parse heading to highlight the second line in blue
  const headingLines = heading.split('\n')
  const firstLine = headingLines[0] || heading
  const secondLine = headingLines[1] || ''

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Fullscreen Background — Image renders instantly (poster), video fades in on top once buffered */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Hero background"
          fill
          priority
          quality={90}
          className="object-cover"
          sizes="100vw"
        />
        {showVideo && !videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={bgImage}
            onCanPlay={() => {
              setVideoReady(true)
              // Explicitly kick off playback; if the browser rejects autoplay
              // (e.g. iOS Low Power Mode) drop the video and keep the poster
              // image instead of leaving a stuck native play button behind.
              videoRef.current?.play().catch(() => setVideoFailed(true))
            }}
            onError={() => setVideoFailed(true)}
            className={`hero-video absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={videoUrl} type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          </video>
        )}
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

        {/* Big Bold Headline - Dynamic */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase text-white leading-[1.1] max-w-4xl mx-auto"
          style={{ fontFamily: 'Inter, Poppins, system-ui, sans-serif' }}
        >
          {firstLine}
          {secondLine && <span className="block text-blue-400">{secondLine}</span>}
        </motion.h1>

        {/* Supporting Text - Dynamic */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
        >
          {description}
        </motion.p>

        {/* CTA Buttons - Dynamic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA */}
          <Link href={ctaLink}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold uppercase tracking-wider text-white bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
            >
              {ctaText}
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

      {/* Marketing Marquee */}
      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 py-3 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative flex overflow-hidden"
        >
          <div className="flex shrink-0 animate-marquee-scroll items-center">
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Free Shipping Australia-Wide
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ 99.9% Contaminant Removal
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ 2-Year Warranty on All Products
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Pure Water, Healthier Life
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Trusted by 500+ Australian Homes
            </span>
          </div>
          <div className="flex shrink-0 animate-marquee-scroll items-center" aria-hidden="true">
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Free Shipping Australia-Wide
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ 99.9% Contaminant Removal
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ 2-Year Warranty on All Products
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Pure Water, Healthier Life
            </span>
            <span className="mx-8 text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap">
              ✦ Trusted by 500+ Australian Homes
            </span>
          </div>
        </motion.div>
      </div>

    </section>
  )
}
