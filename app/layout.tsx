import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MetaPixel from '@/app/components/MetaPixel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InsightIQ — AI Survey Analytics',
  description: 'Turn survey responses into actionable business insights using AI. Sentiment analysis, NPS tracking, forecasting and more. 14-day free trial. Powered by Rentabuka Solutions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MetaPixel />
        {children}
      </body>
    </html>
  )
}
