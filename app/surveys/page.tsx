'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('surveys').select('id, title, status, response_count, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      setSurveys(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{display:'flex'}}><Sidebar active="surveys"/><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontFamily:'system-ui',color:'#7C8494'}}>Loading...</p></div></div>

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="surveys"/>
      <div style={{flex:1,background:'#F7F8FA'}}>
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontSize:18,fontWeight:800,fontFamily:'system-ui'}}>My Surveys</h1>
          <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'7px 16px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>+ New Survey</a>
        </div>
        <div style={{padding:28}}>
          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12}}>
            {surveys.length === 0 ? (
              <div style={{padding:48,textAlign:'center',color:'#7C8494'}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                <p style={{fontFamily:'system-ui',marginBottom:16}}>No surveys yet</p>
                <a href="/surveys/new" style={{background:'#4F46E5',color:'white',padding:'10px 24px',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,fontFamily:'system-ui'}}>Create your first survey →</a>
              </div>
            ) : surveys.map((s:any) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderBottom:'1px solid #F0F2F7'}}>
                <div style={{width:40,height:40,borderRadius:10,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📋</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,fontFamily:'system-ui'}}>{s.title}</div>
                  <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>{new Date(s.created_at).toLocaleDateString('en-ZA')} · <span style={{color:s.status==='active'?'#10B981':'#7C8494',fontWeight:600}}>{s.status}</span></div>
                </div>
                <div style={{textAlign:'right',marginRight:12}}>
                  <div style={{fontSize:20,fontWeight:800,fontFamily:'system-ui'}}>{s.response_count}</div>
                  <div style={{fontSize:11,color:'#7C8494',fontFamily:'system-ui'}}>responses</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a href={`/surveys/${s.id}/responses`} style={{padding:'6px 12px',background:'#EEF2FF',color:'#4F46E5',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>📊 Responses</a>
                  <a href={`https://insightiq.co.za/s/${s.id}`} target="_blank" style={{padding:'6px 12px',background:'#F7F8FA',border:'1px solid #E4E7EE',color:'#3A3F4B',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>📤 Share</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
