'use client'
import { useEffect } from 'react'

export default function MetaPixel() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fbq = (window as any).fbq || function(...args: any[]) {
        ((window as any).fbq.q = (window as any).fbq.q || []).push(args)
      }
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      script.async = true
      document.head.appendChild(script)
      ;(window as any).fbq('init', '1019196577428081')
      ;(window as any).fbq('track', 'PageView')
    }
  }, [])
  return null
}
