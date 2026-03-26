export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  images: string[]
  stock: number
  category: string
  isBestSeller: boolean
  manualUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  userId?: string
  customerName: string
  email: string
  phone?: string
  totalAmount: number
  subtotal: number
  gst: number
  shippingCost: number
  stripePaymentIntent?: string
  stripeSessionId?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  shippingAddress: ShippingAddress
  isGuest: boolean
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number
  price: number
}

export interface Testimonial {
  id: string
  name: string
  review: string
  rating: number
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: Date
  updatedAt: Date
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  apartment?: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export interface CheckoutSession {
  sessionId: string
  url: string
}

export interface CheckoutResponse {
  clientSecret: string
  orderId: string
  paymentIntentId: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
