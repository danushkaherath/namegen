import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// This is the crucial part - update your metadata
export const metadata: Metadata = {
  title: 'PrimeNym - AI-Powered Business Name Generator',
  description: 'Generate the perfect, brandable business name with our AI. Find your next great company name instantly.',
  keywords: 'business name generator, AI name generator, domain availability, startup names',
  authors: [{ name: 'PrimeNym' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'PrimeNym - AI-Powered Business Name Generator',
    description: 'Generate the perfect, brandable business name with our AI.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PrimeNym',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrimeNym - AI-Powered Business Name Generator',
    description: 'Generate the perfect, brandable business name with our AI.',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}