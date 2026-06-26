'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

export default function InsightsPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('surveys').select('*').eq('user_id', session.user.id)
      setSurveys(data || [])
      if (data && data.length > 0) {
        setSelected(data[0])
        const { data: r } = await supabase.from('responses').select('*').eq('survey_id', data[0].id)
        setResponses(r || [])
      }
      setPageLoading(false)
    }
    load()
  }, [])

  async function generateInsight() {
    if (!selected || responses.length === 0) return
    setLoading(true)
    setInsight('')

    const apiKey = localStorage.getItem('anthropic_api_key') || ''
    if (!apiKey) {
      setInsight('⚠️ Please add your Anthropic API key in Settings to use AI Insights.')
      setLoading(false)
      return
    }

    const prompt = `You are an AI analytics assistant. Analyse these survey responses and provide a concise executive summary with key insights, sentiment breakdown, and 3 actionable recommendations.

Survey: "${selected.title}"
Total responses: ${responses.length}
Answers sample: ${JSON.stringify(responses.slice(0,10).map(r => r.answers))}
NPS scores: ${responses.filter(r=>r.nps_score!==null).map(r=>r.nps_score).join(', ')}
Sentiment: Positive: ${responses.filter(r=>r.sentiment==='positive').length}, Neutral: ${responses.filter(r=>r.sentiment==='neutral').length}, Negative: ${responses.filter(r=>r.sentiment==='negative').length}

Provide insights in plain English with bold key numbers. Keep it under 300 words.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      setInsight(data.content?.[0]?.text || 'Could not generate insight')
    } catch {
      setInsight('Error generating insight. Please check your API key.')
    }
    setLoading(false)
  }

  if (pageLoading) return <div style={{display:'flex'}}><Sidebar active="insights"/><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontFamily:'system-ui',color:'#7C8494'}}>Loading...</p></div></div>

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="insights"/>
      <div style={{flex:1,background:'#F7F8FA'}}>
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center'}}>
          <h1 style={{fontSize:18,fontWeight:800,fontFamily:'system-ui'}}>AI Insights</h1>
        </div>
        <div style={{padding:28,maxWidth:800}}>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,fontWeight:600,color:'#7C8494',display:'block',marginBottom:6,fontFamily:'system-ui'}}>Select Survey</label>
            <select value={selected?.id||''} onChange={async e=>{
              const s = surveys.find((sv:any)=>sv.id===e.target.value)
              setSelected(s); setInsight('')
              const {data:r} = await supabase.from('responses').select('*').eq('survey_id',e.target.value)
              setResponses(r||[])
            }} style={{padding:'8px 12px',border:'1px solid #E4E7EE',borderRadius:8,fontSize:13,fontFamily:'system-ui',width:'100%'}}>
              {surveys.map((s:any)=><option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          {selected && (
            <div style={{background:'#1E1B4B',borderRadius:12,padding:24,marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:700,color:'white',fontFamily:'system-ui'}}>✨ AI Executive Summary</div>
                <button onClick={generateInsight} disabled={loading||responses.length===0}
                  style={{padding:'8px 16px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'system-ui'}}>
                  {loading?'Analysing...':responses.length===0?'No responses yet':'Generate Insights'}
                </button>
              </div>
              {insight ? (
                <div style={{fontSize:14,color:'rgba(255,255,255,0.85)',lineHeight:1.7,fontFamily:'system-ui',whiteSpace:'pre-wrap'}}>{insight}</div>
              ) : (
                <div style={{textAlign:'center',padding:32}}>
                  <div style={{fontSize:32,marginBottom:8}}>🤖</div>
                  <p style={{color:'rgba(255,255,255,0.5)',fontFamily:'system-ui',fontSize:13}}>
                    {responses.length===0?'No responses yet — share your survey to collect feedback':'Click "Generate Insights" to analyse your survey responses with AI'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[
              {label:'Total Responses',value:responses.length,color:'#4F46E5'},
              {label:'Positive Sentiment',value:`${responses.length>0?Math.round(responses.filter(r=>r.sentiment==='positive').length/responses.length*100):0}%`,color:'#10B981'},
              {label:'Avg NPS',value:responses.filter(r=>r.nps_score!==null).length>0?Math.round(responses.filter(r=>r.nps_score!==null).reduce((a,r)=>a+r.nps_score,0)/responses.filter(r=>r.nps_score!==null).length):'N/A',color:'#8B5CF6'},
            ].map(({label,value,color})=>(
              <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,borderTop:`3px solid ${color}`}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'#7C8494',marginBottom:8,fontFamily:'system-ui'}}>{label}</div>
                <div style={{fontSize:28,fontWeight:800,fontFamily:'system-ui'}}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
