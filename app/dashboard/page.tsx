'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      const { data: surveysData } = await supabase
        .from('surveys')
        .select('id, title, status, response_count, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setSurveys(surveysData ?? [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ color: '#7C8494' }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  const firstName = user?.email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Top nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #E4E7EE', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📊 InsightHub AI</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#7C8494' }}>{user?.email}</span>
          <button onClick={handleSignOut}
            style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        {/* Trial banner */}
        <div style={{ background: 'linear-gradient(90deg, #EEF2FF, #F5F3FF)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>Free Trial — 14 days remaining</strong>
            <p style={{ fontSize: 12, color: '#7C8494', margin: 0 }}>Upgrade to Professional to unlock AI segmentation, forecasting, and unlimited surveys</p>
          </div>
          <a href="/subscription" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Upgrade ⚡</a>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Good morning, {firstName} 👋
        </h1>
        <p style={{ color: '#7C8494', marginBottom: 28 }}>Here&apos;s what&apos;s happening with your surveys</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Responses', value: surveys.reduce((s: number, r: any) => s + (r.response_count ?? 0), 0), color: '#4F46E5' },
            { label: 'Active Surveys', value: surveys.filter((s: any) => s.status === 'active').length, color: '#10B981' },
            { label: 'Positive Sentiment', value: '0%', color: '#F59E0B' },
            { label: 'NPS Score', value: '+0', color: '#8B5CF6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #E4E7EE', borderRadius: 12, padding: 20, borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7C8494', marginBottom: 10 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Surveys */}
        <div style={{ background: 'white', border: '1px solid #E4E7EE', borderRadius: 12 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E7EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>My Surveys</span>
            <a href="/surveys/new" style={{ background: '#4F46E5', color: 'white', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>+ New Survey</a>
          </div>
          {surveys.length > 0 ? surveys.map((survey: any) => (
            <div key={survey.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid #F0F2F7' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{survey.title}</div>
                <div style={{ fontSize: 12, color: '#7C8494', marginTop: 2 }}>
                  {new Date(survey.created_at).toLocaleDateString('en-ZA')} ·{' '}
                  <span style={{ color: survey.status === 'active' ? '#10B981' : '#7C8494', fontWeight: 600 }}>
                    {survey.status}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{survey.response_count}</div>
                <div style={{ fontSize: 11, color: '#7C8494' }}>responses</div>
              </div>
            </div>
          )) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#7C8494' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ marginBottom: 16 }}>No surveys yet.</p>
              <a href="/surveys/new" style={{ background: '#4F46E5', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Create your first survey →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
