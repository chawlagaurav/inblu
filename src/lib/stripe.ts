import Stripe from 'stripe'

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    console.warn('Stripe secret key not found. Stripe functionality will be disabled.')
    return null
  }
  return new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  })
}

export const stripe = getStripeInstance()

export default stripe
