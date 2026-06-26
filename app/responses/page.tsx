'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: surveysData } = await supabase.from('surveys').select('id, title').eq('user_id', session.user.id)
      setSurveys(surveysData || [])
      const surveyIds = surveysData?.map((s:any) => s.id) || []
      if (surveyIds.length > 0) {
        const { data: responsesData } = await supabase.from('responses').select('*').in('survey_id', surveyIds).order('submitted_at', { ascending: false })
        setResponses(responsesData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{display:'flex'}}><Sidebar active="responses"/><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontFamily:'system-ui',color:'#7C8494'}}>Loading...</p></div></div>

  const filtered = selectedSurvey === 'all' ? responses : responses.filter(r => r.survey_id === selectedSurvey)

  function getSurveyTitle(id: string) {
    return surveys.find((s:any) => s.id === id)?.title || 'Unknown Survey'
  }

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="responses"/>
      <div style={{flex:1,background:'#F7F8FA'}}>
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontSize:18,fontWeight:800,fontFamily:'system-ui'}}>All Responses</h1>
          <select value={selectedSurvey} onChange={e=>setSelectedSurvey(e.target.value)}
            style={{padding:'6px 12px',border:'1px solid #E4E7EE',borderRadius:8,fontSize:13,fontFamily:'system-ui'}}>
            <option value="all">All Surveys</option>
            {surveys.map((s:any) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div style={{padding:28}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
            {[
              {label:'Total',value:filtered.length,color:'#4F46E5'},
              {label:'Positive',value:filtered.filter(r=>r.sentiment==='positive').length,color:'#10B981'},
              {label:'Negative',value:filtered.filter(r=>r.sentiment==='negative').length,color:'#EF4444'},
            ].map(({label,value,color})=>(
              <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,borderTop:`3px solid ${color}`}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'#7C8494',marginBottom:8,fontFamily:'system-ui'}}>{label} Responses</div>
                <div style={{fontSize:28,fontWeight:800,fontFamily:'system-ui'}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #E4E7EE'}}>
              <span style={{fontWeight:700,fontSize:14,fontFamily:'system-ui'}}>{filtered.length} responses</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{padding:48,textAlign:'center',color:'#7C8494'}}>
                <div style={{fontSize:40,marginBottom:12}}>📭</div>
                <p style={{fontFamily:'system-ui'}}>No responses yet — share your survey to collect feedback</p>
              </div>
            ) : filtered.map((r:any,i:number) => (
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px',borderBottom:'1px solid #F0F2F7'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#F0F2F7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#7C8494',flexShrink:0,fontFamily:'system-ui'}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:'system-ui',color:'#0D0F14'}}>{getSurveyTitle(r.survey_id)}</div>
                  <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>{new Date(r.submitted_at).toLocaleString('en-ZA')} · {r.device_type||'desktop'}</div>
                </div>
                {r.nps_score!==null&&<div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,color:'#4F46E5',fontFamily:'system-ui'}}>{r.nps_score}</div><div style={{fontSize:10,color:'#7C8494',fontFamily:'system-ui'}}>NPS</div></div>}
                {r.sentiment&&<span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:100,fontFamily:'system-ui',background:r.sentiment==='positive'?'#ECFDF5':r.sentiment==='negative'?'#FEF2F2':'#FEF9C3',color:r.sentiment==='positive'?'#10B981':r.sentiment==='negative'?'#EF4444':'#92400E'}}>{r.sentiment==='positive'?'😊':r.sentiment==='negative'?'😞':'😐'} {r.sentiment}</span>}
                <a href={`/surveys/${r.survey_id}/responses`} style={{padding:'6px 12px',background:'#EEF2FF',color:'#4F46E5',borderRadius:8,textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>View →</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
