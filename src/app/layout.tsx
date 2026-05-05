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
    default: "Inblu | Premium Water Filtration Australia",
    template: "%s | Inblu",
  },
  description: "Pure, clean drinking water for Australian homes. Discover premium RO water purifiers, undersink filters, and water ionisers at Inblu.",
  keywords: ["water filter", "RO purifier", "water ioniser", "undersink filter", "australia", "clean water", "water purification"],
  authors: [{ name: "Inblu" }],
  creator: "Inblu",
  icons: {
    icon: "/inblu.svg",
    shortcut: "/inblu.svg",
    apple: "/inblu.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Inblu",
    title: "Inblu | Premium Water Filtration Australia",
    description: "Pure, clean drinking water for Australian homes. Premium water purifiers and filters.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inblu - Premium Water Filtration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inblu | Premium Water Filtration Australia",
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
