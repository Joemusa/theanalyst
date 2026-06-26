'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const [{ data: profileData }, { data: surveysData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('surveys').select('id, title, status, response_count, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10),
      ])
      setProfile(profileData)
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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F8FA'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>📊</div>
        <p style={{color:'#7C8494',fontFamily:'system-ui'}}>Loading your dashboard...</p>
      </div>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'
  const plan = profile?.plan ?? 'trial'
  const totalResponses = surveys.reduce((s: number, r: any) => s + (r.response_count ?? 0), 0)
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14

  const planColors: Record<string, string> = {
    trial: '#F59E0B', starter: '#10B981', professional: '#4F46E5', enterprise: '#7C3AED', test: '#10B981'
  }
  const planColor = planColors[plan] || '#F59E0B'

  return (
    <div style={{minHeight:'100vh',background:'#F7F8FA'}}>
      {/* Top nav */}
      <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontWeight:700,fontSize:18,fontFamily:'system-ui'}}>📊 InsightHub AI</div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{background:planColor+'20',color:planColor,fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:100,textTransform:'capitalize',fontFamily:'system-ui'}}>{plan}</span>
          <span style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui'}}>{user?.email}</span>
          <button onClick={handleSignOut} style={{fontSize:13,color:'#4F46E5',fontWeight:600,background:'none',border:'none',cursor:'pointer',fontFamily:'system-ui'}}>Sign out</button>
        </div>
      </div>

      <div style={{padding:32,maxWidth:1200,margin:'0 auto'}}>
        {/* Plan banner */}
        {plan === 'trial' && (
          <div style={{background:'linear-gradient(90deg,#EEF2FF,#F5F3FF)',border:'1px solid rgba(79,70,229,0.2)',borderRadius:12,padding:'12px 20px',display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
            <span style={{fontSize:20}}>🎁</span>
            <div style={{flex:1}}>
              <strong style={{fontSize:14,color:'#F59E0B',fontFamily:'system-ui'}}>Free Trial — {trialDaysLeft} days remaining</strong>
              <p style={{fontSize:12,color:'#7C8494',margin:0,fontFamily:'system-ui'}}>Upgrade to Professional to unlock AI segmentation, forecasting, and unlimited surveys</p>
            </div>
            <a href="/subscription" style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'white',padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',fontFamily:'system-ui'}}>Upgrade ⚡</a>
          </div>
        )}

        <h1 style={{fontSize:24,fontWeight:800,marginBottom:4,fontFamily:'system-ui'}}>Good morning, {firstName} 👋</h1>
        <p style={{color:'#7C8494',marginBottom:28,fontFamily:'system-ui'}}>Here&apos;s what&apos;s happening with your surveys</p>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
          {[
            { label: 'Total Responses', value: totalResponses, color: '#4F46E5' },
            { label: 'Active Surveys', value: surveys.filter((s:any) => s.status==='active').length, color: '#10B981' },
            { label: 'Total Surveys', value: surveys.length, color: '#F59E0B' },
            { label: 'Plan', value: plan.charAt(0).toUpperCase()+plan.slice(1), color: '#8B5CF6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,borderTop:`3px solid ${color}`}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',marginBottom:10,fontFamily:'system-ui'}}>{label}</div>
              <div style={{fontSize:32,fontWeight:800,fontFamily:'system-ui'}}>{value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28}}>
          {[
            { icon:'📋', label:'New Survey', href:'/surveys/new', color:'#4F46E5' },
            { icon:'📊', label:'View Responses', href: surveys[0] ? `/surveys/${surveys[0].id}/responses` : '#', color:'#10B981' },
            { icon:'💳', label:'Upgrade Plan', href:'/subscription', color:'#7C3AED' },
            { icon:'📤', label:'Share Survey', href: surveys[0] ? `https://insightiq.co.za/s/${surveys[0].id}` : '#', color:'#F59E0B' },
          ].map(({ icon, label, href, color }) => (
            <a key={label} href={href}
              style={{background:'white',border:'1px solid #E4E7EE',borderRadius:10,padding:'14px 16px',textDecoration:'none',display:'flex',alignItems:'center',gap:10,transition:'border-color 0.15s'}}>
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontSize:13,fontWeight:600,color:'#0D0F14',fontFamily:'system-ui'}}>{label}</span>
            </a>
          ))}
        </div>

        {/* Surveys */}
        <div id="surveys" style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #E4E7EE',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700,fontSize:15,fontFamily:'system-ui'}}>My Surveys</span>
            <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'7px 16px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>+ New Survey</a>
          </div>
          {surveys.length > 0 ? surveys.map((survey:any) => (
            <div key={survey.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderBottom:'1px solid #F0F2F7'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:'#0D0F14',marginBottom:2,fontFamily:'system-ui'}}>{survey.title}</div>
                <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>
                  {new Date(survey.created_at).toLocaleDateString('en-ZA')} ·{' '}
                  <span style={{color:survey.status==='active'?'#10B981':'#7C8494',fontWeight:600}}>{survey.status}</span>
                </div>
              </div>
              <div style={{textAlign:'right',marginRight:8}}>
                <div style={{fontSize:22,fontWeight:800,color:'#0D0F14',fontFamily:'system-ui'}}>{survey.response_count}</div>
                <div style={{fontSize:11,color:'#7C8494',fontFamily:'system-ui'}}>responses</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <a href={`/surveys/${survey.id}/responses`}
                  style={{padding:'7px 14px',background:'#EEF2FF',color:'#4F46E5',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui',whiteSpace:'nowrap'}}>
                  📊 View Responses
                </a>
                <a href={`https://insightiq.co.za/s/${survey.id}`} target="_blank"
                  style={{padding:'7px 14px',background:'#F7F8FA',border:'1px solid #E4E7EE',color:'#3A3F4B',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui',whiteSpace:'nowrap'}}>
                  📤 Share
                </a>
                <a href={`/surveys/${survey.id}/new`}
                  style={{padding:'7px 14px',background:'#F7F8FA',border:'1px solid #E4E7EE',color:'#3A3F4B',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>
                  ✏️ Edit
                </a>
              </div>
            </div>
          )) : (
            <div style={{padding:48,textAlign:'center',color:'#7C8494'}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <p style={{marginBottom:16,fontFamily:'system-ui'}}>No surveys yet.</p>
              <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'10px 24px',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,fontFamily:'system-ui'}}>Create your first survey →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
