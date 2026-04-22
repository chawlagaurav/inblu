'use client'

import { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import type { StripeElementsOptions } from '@stripe/stripe-js'

interface StripeProviderProps {
  children: ReactNode
  clientSecret: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const stripePromise = getStripe()

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0a508e',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          padding: '12px',
        },
        '.Input:focus': {
          border: '2px solid #0a508e',
          boxShadow: 'none',
        },
        '.Label': {
          fontWeight: '500',
          color: '#1e293b',
          marginBottom: '8px',
        },
        '.Tab': {
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        },
        '.Tab--selected': {
          borderColor: '#0a508e',
          backgroundColor: '#eef4fb',
        },
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}
