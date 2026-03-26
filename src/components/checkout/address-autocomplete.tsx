'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Australian state mapping from Google's long names to abbreviations
const stateAbbreviations: Record<string, string> = {
  'new south wales': 'NSW',
  'victoria': 'VIC',
  'queensland': 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  'tasmania': 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
}

interface AddressComponents {
  address: string
  city: string
  state: string
  postcode: string
  country: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (components: AddressComponents) => void
  placeholder?: string
  className?: string
  id?: string
  name?: string
  required?: boolean
}

declare global {
  interface Window {
    google: typeof google
    initGooglePlaces: () => void
  }
}

let isGoogleLoaded = false
let loadCallbacks: (() => void)[] = []

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (isGoogleLoaded && window.google?.maps?.places) {
      resolve()
      return
    }

    loadCallbacks.push(resolve)

    // Only load the script once
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    window.initGooglePlaces = () => {
      isGoogleLoaded = true
      loadCallbacks.forEach((cb) => cb())
      loadCallbacks = []
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing your address...',
  className,
  id,
  name,
  required,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // Use refs for callbacks to avoid re-creating the listener
  const onChangeRef = useRef(onChange)
  const onAddressSelectRef = useRef(onAddressSelect)
  useEffect(() => {
    onChangeRef.current = onChange
    onAddressSelectRef.current = onAddressSelect
  }, [onChange, onAddressSelect])

  const handlePlaceSelect = useCallback(() => {
    const autocomplete = autocompleteRef.current
    if (!autocomplete) return

    const place = autocomplete.getPlace()
    if (!place.address_components) return

    let streetNumber = ''
    let streetName = ''
    let city = ''
    let state = ''
    let postcode = ''
    let country = ''

    for (const component of place.address_components) {
      const types = component.types

      if (types.includes('street_number')) {
        streetNumber = component.long_name
      }
      if (types.includes('route')) {
        streetName = component.long_name
      }
      if (types.includes('locality') || types.includes('sublocality_level_1')) {
        city = component.long_name
      }
      if (types.includes('administrative_area_level_1')) {
        const stateLower = component.long_name.toLowerCase()
        state = stateAbbreviations[stateLower] || component.short_name
      }
      if (types.includes('postal_code')) {
        postcode = component.long_name
      }
      if (types.includes('country')) {
        country = component.long_name
      }
    }

    const address = streetNumber ? `${streetNumber} ${streetName}` : streetName

    // Synchronously update the DOM input to match what we parsed,
    // then update React state. This prevents the controlled value
    // from reverting the input before React re-renders.
    if (inputRef.current) {
      inputRef.current.value = address
    }

    // Update React state via refs (avoids stale closure issues)
    onChangeRef.current(address)
    onAddressSelectRef.current({
      address,
      city,
      state,
      postcode,
      country,
    })
  }, [])

  useEffect(() => {
    if (!apiKey) return

    loadGoogleMapsScript(apiKey).then(() => {
      setIsLoaded(true)

      if (inputRef.current && !autocompleteRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'au' },
          types: ['address'],
          fields: ['address_components', 'formatted_address'],
        })

        autocomplete.addListener('place_changed', handlePlaceSelect)
        autocompleteRef.current = autocomplete
      }
    })

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  if (!apiKey) {
    // Fallback to regular input if no API key
    return (
      <Input
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="123 Example Street"
        className={className}
      />
    )
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        className={`pr-10 ${className || ''}`}
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <MapPin className={`h-4 w-4 transition-colors ${isFocused ? 'text-sky-500' : 'text-slate-400'}`} />
      </div>
      {isLoaded && (
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          Powered by Google
        </p>
      )}
    </div>
  )
}
