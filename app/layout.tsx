import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MetaPixel from '@/app/components/MetaPixel'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InsightIQ — AI Survey Analytics',
  description: 'Turn survey responses into actionable business insights using AI. Powered by Rentabuka Solutions.',
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MetaPixel />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
