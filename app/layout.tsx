import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'FundRaiserDAO',
  description: 'Transparent onchain fundraising for Base communities.',
  openGraph: {
    title: 'FundRaiserDAO',
    description: 'Create, discover, and back fundraising campaigns on Base.',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
