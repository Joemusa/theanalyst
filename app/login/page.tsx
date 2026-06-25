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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4F46E5 100%)', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 76 76" fill="none"><rect width="76" height="76" rx="18" fill="rgba(255,255,255,0.15)"/><rect x="14" y="46" width="11" height="16" rx="2.5" fill="rgba(255,255,255,0.4)"/><rect x="31" y="34" width="11" height="28" rx="2.5" fill="rgba(255,255,255,0.65)"/><rect x="48" y="22" width="11" height="40" rx="2.5" fill="rgba(255,255,255,0.9)"/><circle cx="64" cy="14" r="7" fill="#10B981"/><circle cx="64" cy="14" r="3.5" fill="white"/></svg>
          </div>
          InsightHub AI
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>Turn survey<br />responses into<br /><em style={{ fontStyle: 'normal', color: '#A5B4FC' }}>business gold</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6 }}>AI-powered analytics that tells you exactly what your customers think — in plain English.</p>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['2.4M', 'Surveys Analysed'], ['+42', 'Avg NPS Score'], ['14 days', 'Free Trial']].map(([n, l]) => (
            <div key={l} style={{ color: 'white' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#A5B4FC' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, marginBottom: 24, width: 'fit-content' }}>✨ 14-day free trial — no card required</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome back</h2>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 32 }}>Sign in to your InsightHub account</p>

        {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.co.za"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            {loading ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--ink-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />or<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '11px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          🌐 Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-muted)' }}>
          Don&apos;t have an account? <a href="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Start free trial</a>
        </p>
      </div>
    </div>
  )
}
