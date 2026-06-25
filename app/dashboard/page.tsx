import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile and surveys first
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

  // Then fetch responses using survey IDs
  const surveyIds = surveys?.map((s: { id: string }) => s.id) ?? []
  const { data: recentResponses } = surveyIds.length > 0
    ? await supabase
        .from('responses')
        .select('id, submitted_at, sentiment, nps_score')
        .in('survey_id', surveyIds)
        .order('submitted_at', { ascending: false })
        .limit(50)
    : { data: [] }

  // Calculate stats
  const totalResponses = surveys?.reduce((sum: number, s: { response_count: number }) => sum + (s.response_count ?? 0), 0) ?? 0

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
  const nps = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0

  return (
    <div style={{ padding: 28 }}>
      {/* Trial banner */}
      {profile?.plan === 'trial' && (
        <div style={{ background: 'linear-gradient(90deg, #EEF2FF, #F5F3FF)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14, color: 'var(--ink)' }}>Free Trial — {trialDaysLeft} days remaining</strong>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>Upgrade to Professional to unlock AI segmentation, forecasting, and unlimited surveys</p>
          </div>
          <a href="/subscription" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Upgrade ⚡</a>
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
        Good morning, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
      </h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 28 }}>Here&apos;s what&apos;s happening with your surveys</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Responses', value: totalResponses, color: 'var(--primary)' },
          { label: 'Active Surveys', value: surveys?.filter((s: { status: string }) => s.status === 'active').length ?? 0, color: 'var(--accent)' },
          { label: 'Positive Sentiment', value: `${sentimentScore}%`, color: 'var(--warning)' },
          { label: 'NPS Score', value: nps >= 0 ? `+${nps}` : `${nps}`, color: 'var(--purple)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: 10 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Surveys list */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>My Surveys</span>
          <a href="/surveys/new" style={{ background: 'var(--primary)', color: 'white', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>+ New Survey</a>
        </div>
        {surveys && surveys.length > 0 ? surveys.map((survey: { id: string; title: string; status: string; response_count: number; created_at: string }) => (
          <div key={survey.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid #F0F2F7' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{survey.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                {new Date(survey.created_at).toLocaleDateString('en-ZA')} ·{' '}
                <span style={{ color: survey.status === 'active' ? 'var(--accent)' : 'var(--ink-muted)', fontWeight: 600 }}>
                  {survey.status}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{survey.response_count}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>responses</div>
            </div>
            <a href={`/surveys/${survey.id}`} style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>View →</a>
          </div>
        )) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p>No surveys yet. <a href="/surveys/new" style={{ color: 'var(--primary)' }}>Create your first survey →</a></p>
          </div>
        )}
      </div>
    </div>
  )
}
