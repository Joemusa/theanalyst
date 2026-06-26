'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

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

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F8FA'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>📊</div>
        <p style={{color:'#7C8494',fontFamily:'system-ui'}}>Loading...</p>
      </div>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'
  const plan = profile?.plan ?? 'trial'
  const totalResponses = surveys.reduce((s: number, r: any) => s + (r.response_count ?? 0), 0)
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="dashboard" />

      <div style={{flex:1,background:'#F7F8FA',overflow:'auto'}}>
        {/* Top bar */}
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:'#0D0F14',fontFamily:'system-ui'}}>Dashboard</h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {plan === 'trial' && (
              <div style={{fontSize:12,color:'#F59E0B',fontWeight:600,fontFamily:'system-ui'}}>🎁 {trialDaysLeft} days left</div>
            )}
            <span style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui'}}>{user?.email}</span>
            <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'7px 16px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>+ New Survey</a>
          </div>
        </div>

        <div style={{padding:28}}>
          {/* Trial banner */}
          {plan === 'trial' && (
            <div style={{background:'linear-gradient(90deg,#EEF2FF,#F5F3FF)',border:'1px solid rgba(79,70,229,0.2)',borderRadius:12,padding:'12px 20px',display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
              <span style={{fontSize:20}}>🎁</span>
              <div style={{flex:1}}>
                <strong style={{fontSize:14,color:'#F59E0B',fontFamily:'system-ui'}}>Free Trial — {trialDaysLeft} days remaining</strong>
                <p style={{fontSize:12,color:'#7C8494',margin:0,fontFamily:'system-ui'}}>Upgrade to unlock AI segmentation, forecasting, and unlimited surveys</p>
              </div>
              <a href="/subscription" style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'white',padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',fontFamily:'system-ui'}}>Upgrade ⚡</a>
            </div>
          )}

          <p style={{color:'#7C8494',marginBottom:24,fontFamily:'system-ui'}}>Good morning, {firstName} 👋 — Here&apos;s what&apos;s happening</p>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
            {[
              { label:'Total Responses', value:totalResponses, color:'#4F46E5' },
              { label:'Active Surveys', value:surveys.filter((s:any)=>s.status==='active').length, color:'#10B981' },
              { label:'Total Surveys', value:surveys.length, color:'#F59E0B' },
              { label:'Plan', value:plan.charAt(0).toUpperCase()+plan.slice(1), color:'#8B5CF6' },
            ].map(({label,value,color})=>(
              <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,borderTop:`3px solid ${color}`}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',marginBottom:10,fontFamily:'system-ui'}}>{label}</div>
                <div style={{fontSize:28,fontWeight:800,fontFamily:'system-ui'}}>{value}</div>
              </div>
            ))}
          </div>

          {/* Surveys */}
          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #E4E7EE',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:15,fontFamily:'system-ui'}}>My Surveys</span>
              <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'7px 16px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>+ New Survey</a>
            </div>
            {surveys.length > 0 ? surveys.map((survey:any)=>(
              <div key={survey.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px',borderBottom:'1px solid #F0F2F7'}}>
                <div style={{width:38,height:38,borderRadius:10,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📋</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,color:'#0D0F14',fontFamily:'system-ui'}}>{survey.title}</div>
                  <div style={{fontSize:12,color:'#7C8494',marginTop:2,fontFamily:'system-ui'}}>
                    {new Date(survey.created_at).toLocaleDateString('en-ZA')} · <span style={{color:survey.status==='active'?'#10B981':'#7C8494',fontWeight:600}}>{survey.status}</span>
                  </div>
                </div>
                <div style={{textAlign:'right',marginRight:8}}>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:'system-ui'}}>{survey.response_count}</div>
                  <div style={{fontSize:11,color:'#7C8494',fontFamily:'system-ui'}}>responses</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a href={`/surveys/${survey.id}/responses`}
                    style={{padding:'6px 12px',background:'#EEF2FF',color:'#4F46E5',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui',whiteSpace:'nowrap'}}>
                    📊 Responses
                  </a>
                  <a href={`https://insightiq.co.za/s/${survey.id}`} target="_blank"
                    style={{padding:'6px 12px',background:'#F7F8FA',border:'1px solid #E4E7EE',color:'#3A3F4B',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui',whiteSpace:'nowrap'}}>
                    📤 Share
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
    </div>
  )
}
