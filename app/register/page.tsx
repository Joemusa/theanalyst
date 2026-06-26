'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', company: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, company_name: form.company },
        emailRedirectTo: `https://theanalyst-one.vercel.app/auth/callback`,
      },
    })
    
    // Track signup conversion
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead')
    }
    setSuccess(true)
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 420, textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#7C8494', lineHeight: 1.6 }}>We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account and start your 14-day free trial.</p>
        <a href="/login" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#4F46E5', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Back to login</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4F46E5 100%)', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '20px', fontWeight: 700 }}>
          <img src="/icon.svg" alt="InsightIQ" style={{width:28,height:28,borderRadius:6,marginRight:8}}/> InsightIQ
        </div>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>Understand your<br />customers in<br /><span style={{ color: '#A5B4FC' }}>minutes, not months</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6 }}>Join South African businesses using AI to unlock customer insights.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Your 14-day trial includes:</div>
          {['3 surveys', '100 responses', 'AI Executive Summary', 'Sentiment Analysis', 'PDF Reports'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>{f}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Start your free trial</h2>
        <p style={{ color: '#7C8494', marginBottom: 32 }}>No credit card required</p>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {[
            { label: 'Full name', key: 'fullName', type: 'text', placeholder: 'Joseph Hlongwane' },
            { label: 'Work email', key: 'email', type: 'email', placeholder: 'you@company.co.za' },
            { label: 'Company name', key: 'company', type: 'text', placeholder: 'Data Orbis' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3A3F4B', marginBottom: 6 }}>{label}</label>
              <input type={type} placeholder={placeholder} required
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E7EE', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Start free trial →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#7C8494' }}>
          Already have an account? <a href="/login" style={{ color: '#4F46E5', fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
