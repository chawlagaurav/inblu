import { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

export const metadata: Metadata = {
  title: 'Contact Us | Get Expert Water Filter Advice | Inblu Australia',
  description: 'Contact Inblu Filters for expert water filtration advice. Call +61 431 318 665 or visit us at The Ponds, NSW. Free consultation available.',
  keywords: ['contact water filter experts', 'water filter consultation Australia', 'Inblu Filters contact'],
  alternates: {
    canonical: '/support/contact',
  },
  openGraph: {
    title: 'Contact Us | Inblu Filters Australia',
    description: 'Get expert water filtration advice. Call +61 431 318 665 or visit us at The Ponds, NSW.',
    url: `${BASE_URL}/support/contact`,
    type: 'website',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
