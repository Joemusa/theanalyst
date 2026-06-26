'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResponsesPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const surveyId = window.location.pathname.split('/')[2]

      const [{ data: surveyData }, { data: responsesData }] = await Promise.all([
        supabase.from('surveys').select('*').eq('id', surveyId).single(),
        supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false })
      ])

      setSurvey(surveyData)
      setResponses(responsesData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F8FA'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:44,height:44,border:'4px solid #E4E7EE',borderTopColor:'#4F46E5',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}></div>
        <p style={{color:'#7C8494',fontFamily:'system-ui'}}>Loading responses...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const positive = responses.filter(r => r.sentiment === 'positive').length
  const neutral = responses.filter(r => r.sentiment === 'neutral').length
  const negative = responses.filter(r => r.sentiment === 'negative').length
  const npsScores = responses.filter(r => r.nps_score !== null).map(r => r.nps_score)
  const promoters = npsScores.filter(s => s >= 9).length
  const detractors = npsScores.filter(s => s <= 6).length
  const nps = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null

  function getSentimentColor(s: string) {
    if (s === 'positive') return '#10B981'
    if (s === 'negative') return '#EF4444'
    return '#F59E0B'
  }

  function getSentimentEmoji(s: string) {
    if (s === 'positive') return '😊'
    if (s === 'negative') return '😞'
    return '😐'
  }

  const questions = survey?.questions || []

  return (
    <div style={{minHeight:'100vh',background:'#F7F8FA'}}>
      {/* Top nav */}
      <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/dashboard" style={{color:'#7C8494',textDecoration:'none',fontSize:13,fontFamily:'system-ui'}}>← Dashboard</a>
          <span style={{color:'#E4E7EE'}}>/</span>
          <span style={{fontSize:14,fontWeight:700,color:'#0D0F14',fontFamily:'system-ui'}}>{survey?.title}</span>
          <span style={{color:'#E4E7EE'}}>/</span>
          <span style={{fontSize:14,color:'#7C8494',fontFamily:'system-ui'}}>Responses</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui'}}>{responses.length} total responses</span>
          <a href={`https://insightiq.co.za/s/${window.location.pathname.split('/')[2]}`} target="_blank"
            style={{padding:'6px 14px',background:'#4F46E5',color:'white',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>
            📤 Share Survey
          </a>
        </div>
      </div>

      <div style={{padding:24,maxWidth:1100,margin:'0 auto'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[
            { label: 'Total Responses', value: responses.length, color: '#4F46E5' },
            { label: 'Positive', value: `${positive} (${responses.length > 0 ? Math.round(positive/responses.length*100) : 0}%)`, color: '#10B981' },
            { label: 'Negative', value: `${negative} (${responses.length > 0 ? Math.round(negative/responses.length*100) : 0}%)`, color: '#EF4444' },
            { label: 'NPS Score', value: nps !== null ? (nps >= 0 ? `+${nps}` : `${nps}`) : 'N/A', color: '#8B5CF6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,borderTop:`3px solid ${color}`}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',marginBottom:8,fontFamily:'system-ui'}}>{label}</div>
              <div style={{fontSize:26,fontWeight:800,color:'#0D0F14',fontFamily:'system-ui'}}>{value}</div>
            </div>
          ))}
        </div>

        {/* Sentiment bar */}
        {responses.length > 0 && (
          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0D0F14',marginBottom:12,fontFamily:'system-ui'}}>Sentiment Breakdown</div>
            <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',gap:2}}>
              <div style={{width:`${responses.length > 0 ? (positive/responses.length*100) : 0}%`,background:'#10B981',transition:'width 0.3s'}}></div>
              <div style={{width:`${responses.length > 0 ? (neutral/responses.length*100) : 0}%`,background:'#F59E0B',transition:'width 0.3s'}}></div>
              <div style={{width:`${responses.length > 0 ? (negative/responses.length*100) : 0}%`,background:'#EF4444',transition:'width 0.3s'}}></div>
            </div>
            <div style={{display:'flex',gap:20,marginTop:10}}>
              {[['#10B981','Positive',positive],['#F59E0B','Neutral',neutral],['#EF4444','Negative',negative]].map(([color,label,count]) => (
                <div key={String(label)} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'system-ui'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:String(color)}}></div>
                  <span style={{color:'#7C8494'}}>{String(label)}</span>
                  <strong style={{color:'#0D0F14'}}>{String(count)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 380px':'1fr',gap:16}}>
          {/* Responses list */}
          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #E4E7EE',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:14,fontFamily:'system-ui'}}>All Responses</span>
            </div>
            {responses.length === 0 ? (
              <div style={{padding:48,textAlign:'center',color:'#7C8494'}}>
                <div style={{fontSize:40,marginBottom:12}}>📭</div>
                <p style={{fontFamily:'system-ui',marginBottom:8}}>No responses yet</p>
                <a href={`https://insightiq.co.za/s/${window.location.pathname.split('/')[2]}`} target="_blank"
                  style={{color:'#4F46E5',fontFamily:'system-ui',fontSize:13}}>Share your survey to collect responses →</a>
              </div>
            ) : responses.map((r, idx) => (
              <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px',borderBottom:'1px solid #F0F2F7',cursor:'pointer',background:selected?.id===r.id?'#EEF2FF':'white',transition:'background 0.1s'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#F0F2F7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#7C8494',flexShrink:0,fontFamily:'system-ui'}}>
                  {idx + 1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#0D0F14',marginBottom:2,fontFamily:'system-ui'}}>
                    Response #{responses.length - idx}
                    {r.respondent_email && <span style={{fontWeight:400,color:'#7C8494'}}> · {r.respondent_email}</span>}
                  </div>
                  <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>
                    {new Date(r.submitted_at).toLocaleString('en-ZA')} · {r.device_type || 'desktop'}
                  </div>
                </div>
                {r.nps_score !== null && (
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#4F46E5',fontFamily:'system-ui'}}>{r.nps_score}</div>
                    <div style={{fontSize:10,color:'#7C8494',fontFamily:'system-ui'}}>NPS</div>
                  </div>
                )}
                {r.sentiment && (
                  <div style={{display:'flex',alignItems:'center',gap:4,background:`${getSentimentColor(r.sentiment)}15`,color:getSentimentColor(r.sentiment),padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>
                    {getSentimentEmoji(r.sentiment)} {r.sentiment}
                  </div>
                )}
                <span style={{color:'#C7D2FE',fontSize:16}}>›</span>
              </div>
            ))}
          </div>

          {/* Response detail panel */}
          {selected && (
            <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,overflow:'hidden',height:'fit-content'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #E4E7EE',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:14,fontFamily:'system-ui'}}>Response Detail</span>
                <button onClick={() => setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#7C8494'}}>×</button>
              </div>
              <div style={{padding:20}}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                  {selected.sentiment && (
                    <span style={{background:`${getSentimentColor(selected.sentiment)}15`,color:getSentimentColor(selected.sentiment),padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>
                      {getSentimentEmoji(selected.sentiment)} {selected.sentiment}
                    </span>
                  )}
                  {selected.nps_score !== null && (
                    <span style={{background:'#EEF2FF',color:'#4F46E5',padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:600,fontFamily:'system-ui'}}>
                      NPS: {selected.nps_score}
                    </span>
                  )}
                  <span style={{background:'#F7F8FA',color:'#7C8494',padding:'4px 10px',borderRadius:100,fontSize:12,fontFamily:'system-ui'}}>
                    {selected.device_type || 'desktop'}
                  </span>
                </div>
                <div style={{fontSize:12,color:'#7C8494',marginBottom:16,fontFamily:'system-ui'}}>
                  Submitted: {new Date(selected.submitted_at).toLocaleString('en-ZA')}
                </div>

                {questions.map((q: any, idx: number) => {
                  const answer = selected.answers?.[q.id]
                  return (
                    <div key={q.id} style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid #F0F2F7'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#7C8494',marginBottom:4,fontFamily:'system-ui'}}>Q{idx+1}. {q.text}</div>
                      <div style={{fontSize:14,color:'#0D0F14',fontFamily:'system-ui',fontWeight:500}}>
                        {answer === undefined || answer === null || answer === ''
                          ? <span style={{color:'#B0B8C8',fontStyle:'italic'}}>Not answered</span>
                          : Array.isArray(answer)
                          ? answer.join(', ')
                          : String(answer)
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
