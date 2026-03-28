'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Prevent scrolling while splash is visible
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      setShow(false)
      document.body.style.overflow = ''
    }, 1800)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-7xl font-bold text-sky-600 tracking-tight">
              Inblu
            </h1>
            <motion.div
              className="h-0.5 bg-sky-600/40 mx-auto mt-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
