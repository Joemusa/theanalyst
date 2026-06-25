'use client'

import { useEffect, useState } from 'react'

type Question = { id: number; type: string; text: string; required: boolean; choices: string[] }

export default function PublicSurveyPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/surveys?id=eq.${params.id}&status=eq.active&select=*`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        )
        const data = await res.json()
        if (!data || data.length === 0) { setNotFound(true); setLoading(false); return }
        setSurvey(data[0])
        setLoading(false)
      } catch {
        setNotFound(true)
        setLoading(false)
      }
    }
    loadSurvey()
  }, [params.id])

  function setAnswer(questionId: number, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setErrors(prev => ({ ...prev, [questionId]: false }))
  }

  function toggleMultiChoice(questionId: number, choice: string) {
    const current: string[] = answers[questionId] || []
    const updated = current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice]
    setAnswer(questionId, updated)
  }

  async function handleSubmit() {
    const questions: Question[] = survey.questions || []
    const newErrors: Record<string, boolean> = {}
    let hasErrors = false
    questions.forEach(q => {
      if (q.required) {
        const ans = answers[q.id]
        if (!ans || (Array.isArray(ans) && ans.length === 0) || ans === '') {
          newErrors[q.id] = true
          hasErrors = true
        }
      }
    })
    if (hasErrors) { setErrors(newErrors); return }
    setSubmitting(true)

    const npsQ = questions.find(q => q.type === 'nps')
    const npsScore = npsQ ? parseInt(answers[npsQ.id]) : null
    const ratingQ = questions.find(q => q.type === 'rating')
    const rating = ratingQ ? parseInt(answers[ratingQ.id]) : null
    let sentiment = 'neutral'
    if ((rating !== null && rating >= 4) || (npsScore !== null && npsScore >= 9)) sentiment = 'positive'
    else if ((rating !== null && rating <= 2) || (npsScore !== null && npsScore <= 6)) sentiment = 'negative'

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          survey_id: params.id,
          answers,
          nps_score: npsScore,
          sentiment,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          completed: true,
          submitted_at: new Date().toISOString(),
        })
      })
      if (!res.ok) { const err = await res.text(); alert('Error: ' + err); setSubmitting(false); return }
      setSubmitted(true)
    } catch (e) {
      alert('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const accentColor = survey?.accent_color || '#4F46E5'

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,border:'4px solid #E4E7EE',borderTopColor:'#4F46E5',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}></div>
        <p style={{color:'#7C8494',fontSize:14}}>Loading survey...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5'}}>
      <div style={{textAlign:'center',maxWidth:400,padding:20}}>
        <div style={{fontSize:56,marginBottom:16}}>🔍</div>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:8,fontFamily:'system-ui,sans-serif'}}>Survey not found</h2>
        <p style={{color:'#7C8494',fontSize:14,lineHeight:1.6}}>This survey may have been closed or the link is incorrect. Please contact the sender for a new link.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5',padding:20}}>
      <div style={{background:'white',borderRadius:16,padding:48,maxWidth:480,width:'100%',textAlign:'center',boxShadow:'0 12px 32px rgba(0,0,0,0.08)'}}>
        <div style={{width:72,height:72,background:'#ECFDF5',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:32}}>🎉</div>
        <h2 style={{fontSize:24,fontWeight:800,marginBottom:8,fontFamily:'system-ui,sans-serif',color:'#0D0F14'}}>Thank you!</h2>
        <p style={{color:'#7C8494',lineHeight:1.6,fontSize:15,marginBottom:24}}>Your response has been submitted successfully. We really appreciate you taking the time to share your feedback.</p>
        <div style={{background:'#F7F8FA',borderRadius:10,padding:'12px 20px',fontSize:13,color:'#7C8494'}}>Powered by <strong style={{color:'#4F46E5'}}>InsightIQ</strong> — AI Survey Analytics</div>
      </div>
    </div>
  )

  const questions: Question[] = survey.questions || []
  const answered = Object.keys(answers).length
  const total = questions.length
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5',paddingBottom:40}}>
      <div style={{background:accentColor,padding:'32px 20px 28px',color:'white'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          {survey.company_name && <div style={{fontSize:12,opacity:0.7,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{survey.company_name}</div>}
          <h1 style={{fontSize:26,fontWeight:800,marginBottom:6,fontFamily:'system-ui,sans-serif'}}>{survey.title}</h1>
          {survey.description && <p style={{fontSize:14,opacity:0.8,lineHeight:1.5}}>{survey.description}</p>}
          <div style={{marginTop:16,background:'rgba(255,255,255,0.2)',height:4,borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:'rgba(255,255,255,0.85)',borderRadius:2,transition:'width 0.3s'}}></div>
          </div>
          <div style={{fontSize:11,opacity:0.6,marginTop:6}}>{answered} of {total} answered</div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:'0 auto',padding:'24px 20px 0'}}>
        {questions.map((q, idx) => (
          <div key={q.id} style={{background:'white',borderRadius:12,padding:24,marginBottom:16,border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:16}}>
              <span style={{background:accentColor,color:'white',width:26,height:26,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,marginTop:1}}>{idx+1}</span>
              <div style={{flex:1}}>
                <span style={{fontSize:15,fontWeight:600,color:'#0D0F14',lineHeight:1.4,fontFamily:'system-ui,sans-serif'}}>{q.text}</span>
                {q.required && <span style={{color:'#EF4444',marginLeft:4}}>*</span>}
              </div>
            </div>
            {errors[q.id] && <div style={{background:'#FEF2F2',color:'#EF4444',fontSize:12,padding:'6px 10px',borderRadius:6,marginBottom:10}}>This question is required</div>}

            {q.type==='rating' && <>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} type="button" onClick={()=>setAnswer(q.id,n)}
                    style={{width:52,height:52,border:'1.5px solid',borderColor:answers[q.id]===n?accentColor:'#E4E7EE',borderRadius:10,background:answers[q.id]===n?accentColor:'white',color:answers[q.id]===n?'white':'#0D0F14',fontSize:16,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'system-ui,sans-serif'}}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:12,color:'#7C8494'}}><span>Very poor</span><span>Excellent</span></div>
            </>}

            {q.type==='nps' && <>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} type="button" onClick={()=>setAnswer(q.id,n)}
                    style={{width:46,height:46,border:'1.5px solid',borderColor:answers[q.id]===n?accentColor:'#E4E7EE',borderRadius:8,background:answers[q.id]===n?accentColor:'white',color:answers[q.id]===n?'white':'#0D0F14',fontSize:14,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'system-ui,sans-serif'}}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:12,color:'#7C8494'}}><span>Not at all likely</span><span>Extremely likely</span></div>
            </>}

            {q.type==='single' && q.choices.map((c,i)=>(
              <label key={i} onClick={()=>setAnswer(q.id,c)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:'1.5px solid',borderColor:answers[q.id]===c?accentColor:'#E4E7EE',borderRadius:10,cursor:'pointer',marginBottom:8,background:answers[q.id]===c?`${accentColor}10`:'white',transition:'all 0.15s'}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${answers[q.id]===c?accentColor:'#C7D2FE'}`,background:answers[q.id]===c?accentColor:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {answers[q.id]===c&&<div style={{width:6,height:6,borderRadius:'50%',background:'white'}}></div>}
                </div>
                <span style={{fontSize:14,color:'#3A3F4B',fontFamily:'system-ui,sans-serif'}}>{c}</span>
              </label>
            ))}

            {q.type==='multiple' && q.choices.map((c,i)=>{
              const sel=(answers[q.id]||[]).includes(c)
              return (
                <label key={i} onClick={()=>toggleMultiChoice(q.id,c)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:'1.5px solid',borderColor:sel?accentColor:'#E4E7EE',borderRadius:10,cursor:'pointer',marginBottom:8,background:sel?`${accentColor}10`:'white',transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?accentColor:'#C7D2FE'}`,background:sel?accentColor:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {sel&&<span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:14,color:'#3A3F4B',fontFamily:'system-ui,sans-serif'}}>{c}</span>
                </label>
              )
            })}

            {q.type==='text'&&<input type="text" placeholder="Type your answer here..." value={answers[q.id]||''} onChange={e=>setAnswer(q.id,e.target.value)}
              style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`,borderRadius:8,fontSize:14,fontFamily:'system-ui,sans-serif',outline:'none',boxSizing:'border-box'}}/>}

            {q.type==='longtext'&&<textarea placeholder="Type your answer here..." value={answers[q.id]||''} rows={4} onChange={e=>setAnswer(q.id,e.target.value)}
              style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`,borderRadius:8,fontSize:14,fontFamily:'system-ui,sans-serif',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>}
          </div>
        ))}

        <button type="button" onClick={handleSubmit} disabled={submitting}
          style={{width:'100%',padding:16,background:submitting?'#818CF8':accentColor,color:'white',border:'none',borderRadius:10,fontSize:16,fontWeight:700,cursor:submitting?'not-allowed':'pointer',fontFamily:'system-ui,sans-serif',marginTop:8,transition:'background 0.15s'}}>
          {submitting?'Submitting...':'Submit Survey →'}
        </button>
        <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#B0B8C8'}}>
          Powered by <strong style={{color:'#4F46E5'}}>InsightIQ</strong> · AI Survey Analytics
        </div>
      </div>
    </div>
  )
}
