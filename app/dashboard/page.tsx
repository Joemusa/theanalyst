import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

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

  const surveyIds = surveys?.map((s: { id: string }) => s.id) ?? []
  const { data: recentResponses } = surveyIds.length > 0
    ? await supabase
        .from('responses')
        .select('id, submitted_at, sentiment, nps_score')
        .in('survey_id', surveyIds)
        .order('submitted_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const totalResponses = surveys?.reduce((sum: number, s: { response_count: number }) =>
    sum + (s.response_count ?? 0), 0) ?? 0

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14

  const responses = recentResponses ?? []
  const positiveCount = responses.filter((r: { sentiment: string }) => r.sentiment === 'positive').length
  const sentimentTotal = responses.filter((r: { sentiment: string }) => r.sentiment).length
  const sentimentScore = sentimentTotal > 0 ? Math.round((positiveCount / sentimentTotal) * 100) : 0

  const npsScores = responses
    .filter((r: { nps_score: number | null }) => r.nps_score !== null)
    .map((r: { nps_score: number }) => r.nps_score)
  const promoters = npsScores.filter((s: number) => s >= 9).length
  const detractors = npsScores.filter((s: number) => s <= 6).length
  const nps = npsScores.length > 0
    ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Top nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #E4E7EE', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 18 }}>
          📊 InsightHub AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#7C8494' }}>{user.email}</span>
          <a href="/api/auth/signout" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Sign out</a>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        {/* Trial banner */}
        {(!profile?.plan || profile?.plan === 'trial') && (
          <div style={{ background: 'linear-gradient(90deg, #EEF2FF, #F5F3FF)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>🎁</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14 }}>Free Trial — {trialDaysLeft} days remaining</strong>
              <p style={{ fontSize: 12, color: '#7C8494', margin: 0 }}>Upgrade to Professional to unlock AI segmentation, forecasting, and unlimited surveys</p>
            </div>
            <a href="/subscription" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Upgrade ⚡</a>
          </div>
        )}

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Good morning, {firstName} 👋
        </h1>
        <p style={{ color: '#7C8494', marginBottom: 28 }}>Here&apos;s what&apos;s happening with your surveys</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Responses', value: totalResponses, color: '#4F46E5' },
            { label: 'Active Surveys', value: surveys?.filter((s: { status: string }) => s.status === 'active').length ?? 0, color: '#10B981' },
            { label: 'Positive Sentiment', value: `${sentimentScore}%`, color: '#F59E0B' },
            { label: 'NPS Score', value: nps >= 0 ? `+${nps}` : `${nps}`, color: '#8B5CF6' },
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
          {surveys && surveys.length > 0 ? surveys.map((survey: { id: string; title: string; status: string; response_count: number; created_at: string }) => (
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
