'use client'

import { create } from 'zustand'

/**
 * Tiny store shared between the admin header (which renders the trigger button)
 * and the admin sidebar (which renders the off-canvas drawer). Lives separate
 * from the cart store so its state never leaks into the public site.
 */
interface AdminUiStore {
  isMobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
  toggleMobileNav: () => void
}

export const useAdminUi = create<AdminUiStore>((set) => ({
  isMobileNavOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
}))
