'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, UserCheck } from 'lucide-react'
import { Label } from '@/components/ui/label'

export interface CustomerOption {
  type: 'registered' | 'guest'
  id: string
  email: string
  name: string
  phone: string | null
  orderCount: number
  address: {
    address?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  } | null
}

interface CustomerSearchSelectProps {
  onSelect: (customer: CustomerOption) => void
}

export function CustomerSearchSelect({ onSelect }: CustomerSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<CustomerOption | null>(null)

  // Track the latest request so out-of-order responses are ignored.
  const requestIdRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search against the existing customers API.
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const currentRequest = ++requestIdRef.current
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(trimmed)}`)
        if (!res.ok) throw new Error('Failed to search customers')
        const data = await res.json()
        // Ignore stale responses.
        if (currentRequest !== requestIdRef.current) return
        setResults((data.customers || []) as CustomerOption[])
        setOpen(true)
      } catch {
        if (currentRequest === requestIdRef.current) setResults([])
      } finally {
        if (currentRequest === requestIdRef.current) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(customer: CustomerOption) {
    setSelected(customer)
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(customer)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setResults([])
  }

  return (
    <div className="mb-4" ref={containerRef}>
      <Label htmlFor="customerSearch">Select existing customer (optional)</Label>

      {selected ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-slate-900">{selected.name}</span>
            <span className="text-slate-500">· {selected.email}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-1 text-slate-400 hover:bg-emerald-100 hover:text-slate-600"
            aria-label="Clear selected customer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative mt-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="customerSearch"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search by name or email…"
              autoComplete="off"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>

          {open && results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {results.map((c) => (
                <li key={`${c.type}-${c.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-500">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ''}
                      {` · ${c.orderCount} order${c.orderCount === 1 ? '' : 's'}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && !loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
              No matching customers. Enter details manually below.
            </div>
          )}
        </div>
      )}

      <p className="mt-1 text-xs text-slate-400">
        Or enter a new customer&apos;s details manually below.
      </p>
    </div>
  )
}
