'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4F46E5 100%)', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '20px', fontWeight: 700 }}>
          📊 InsightHub AI
        </div>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>Turn survey<br />responses into<br /><span style={{ color: '#A5B4FC' }}>business gold</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6 }}>AI-powered analytics that tells you exactly what your customers think — in plain English.</p>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['2.4M', 'Surveys Analysed'], ['+42', 'Avg NPS Score'], ['14 days', 'Free Trial']].map(([n, l]) => (
            <div key={l} style={{ color: 'white' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#A5B4FC' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, marginBottom: 24, width: 'fit-content' }}>✨ 14-day free trial — no card required</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome back</h2>
        <p style={{ color: '#7C8494', marginBottom: 32 }}>Sign in to your InsightHub account</p>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3A3F4B', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.co.za"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E7EE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3A3F4B', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E7EE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#7C8494' }}>
          Don&apos;t have an account? <a href="/register" style={{ color: '#4F46E5', fontWeight: 500 }}>Start free trial</a>
        </p>
      </div>
    </div>
  )
}
