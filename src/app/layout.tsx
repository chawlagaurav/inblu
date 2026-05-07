import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema } from "@/components/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Water Filters Australia | RO Purifiers & Filtration Systems | Inblu",
    template: "%s | Inblu Filters Australia",
  },
  description: "Australia's leading water filtration specialists. Shop RO water purifiers, countertop filters, undersink systems & water ionisers. Free installation & shipping Australia-wide. Pure, clean drinking water for your home.",
  keywords: [
    "water filter Australia",
    "RO water filter",
    "reverse osmosis Australia",
    "water purifier",
    "countertop water filter",
    "undersink water filter",
    "water ioniser Australia",
    "home water filtration",
    "best water filter Australia",
    "buy water filter online",
    "water filter Sydney",
    "water filter Melbourne",
    "clean drinking water",
    "water purification system",
  ],
  authors: [{ name: "Inblu Filters", url: BASE_URL }],
  creator: "Inblu Filters",
  publisher: "Inblu Filters Pty Ltd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/inblufavicon.png", sizes: "any" },
      { url: "/inblufavicon.png", type: "image/png", sizes: "32x32" },
      { url: "/inblufavicon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/inblufavicon.png",
    apple: [
      { url: "/inblufavicon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: BASE_URL,
    siteName: "Inblu Filters",
    title: "Water Filters Australia | RO Purifiers & Filtration Systems | Inblu",
    description: "Australia's leading water filtration specialists. Shop RO water purifiers, countertop filters, undersink systems. Free installation & shipping Australia-wide.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inblu Filters - Premium Water Filtration Systems Australia",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@inblufilters",
    creator: "@inblufilters",
    title: "Water Filters Australia | Inblu Filters",
    description: "Australia's leading water filtration specialists. Premium RO purifiers, countertop & undersink filters.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en-AU': BASE_URL,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className="scroll-smooth">
      <head>
        {/* Structured Data for SEO */}
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebsiteSchema />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
        {children}
        <Toaster 
          position="top-right" 
          closeButton
          toastOptions={{
            style: {
              borderRadius: '1rem',
            },
          }}
        />
      </body>
    </html>
  );
}
