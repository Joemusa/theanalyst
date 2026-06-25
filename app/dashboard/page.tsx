import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Show debug info instead of redirecting
  if (error || !user) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>Not authenticated</h2>
        <p>Error: {error?.message ?? 'No user found'}</p>
        <a href="/login">Go to login</a>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: surveys } = await supabase
    .from('surveys')
    .select('id, title, status, response_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Top nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #E4E7EE', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📊 InsightHub AI</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#7C8494' }}>{user.email}</span>
          <a href="/api/auth/signout" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Sign out</a>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Welcome, {firstName} 👋
        </h1>
        <p style={{ color: '#7C8494', marginBottom: 28 }}>
          Logged in as: {user.email}
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Responses', value: 0, color: '#4F46E5' },
            { label: 'Active Surveys', value: surveys?.filter((s: { status: string }) => s.status === 'active').length ?? 0, color: '#10B981' },
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
          <div style={{ padding: 40, textAlign: 'center', color: '#7C8494' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ marginBottom: 16 }}>No surveys yet.</p>
            <a href="/surveys/new" style={{ background: '#4F46E5', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Create your first survey →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
