import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Inblu Filters | Premium Water Filtration",
    template: "%s | Inblu Filters",
  },
  description: "Pure, clean drinking water for Australian homes. Discover premium RO water purifiers, undersink filters, and water ionisers at Inblu.",
  keywords: ["water filter", "RO purifier", "water ioniser", "undersink filter", "australia", "clean water", "water purification"],
  authors: [{ name: "Inblu Filters" }],
  creator: "Inblu Filters",
  icons: {
    icon: [
      { url: "/inblufavicon.png", sizes: "any" },
      { url: "/inblufavicon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/inblufavicon.png",
    apple: [
      { url: "/inblufavicon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Inblu Filters",
    title: "Inblu Filters | Premium Water Filtration",
    description: "Pure, clean drinking water for Australian homes. Premium water purifiers and filters.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inblu Filters | Premium Water Filtration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inblu Filters | Premium Water Filtration",
    description: "Pure, clean drinking water for Australian homes. Premium water purifiers and filters.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
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
