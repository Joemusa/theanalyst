'use client'
import { useEffect, useState } from 'react'

type Question = { id: number; type: string; text: string; required: boolean; choices: string[] }

export default function PublicSurveyPage({ params }: { params: { id: string } }) {
  const [surveyId, setSurveyId] = useState<string>('')
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    // Get ID from URL directly to avoid Next.js 15 params issue
    const id = window.location.pathname.split('/').pop() || ''
    setSurveyId(id)
    if (!id) { setNotFound(true); setLoading(false); return }

    fetch(`${SUPABASE_URL}/rest/v1/surveys?id=eq.${id}&status=eq.active&select=*`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    }).then(r => r.json()).then(data => {
      if (!data || data.length === 0) setNotFound(true)
      else setSurvey(data[0])
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [])

  function setAnswer(qId: number, value: any) {
    setAnswers(p => ({ ...p, [qId]: value }))
    setErrors(p => ({ ...p, [qId]: false }))
  }

  function toggleChoice(qId: number, choice: string) {
    const curr: string[] = answers[qId] || []
    setAnswer(qId, curr.includes(choice) ? curr.filter(c => c !== choice) : [...curr, choice])
  }

  async function handleSubmit() {
    const questions: Question[] = survey.questions || []
    const errs: Record<string, boolean> = {}
    let hasErr = false
    questions.forEach(q => {
      if (q.required) {
        const a = answers[q.id]
        if (!a || (Array.isArray(a) && !a.length) || a === '') {
          errs[q.id] = true
          hasErr = true
        }
      }
    })
    if (hasErr) { setErrors(errs); return }
    setSubmitting(true)

    const npsQ = questions.find(q => q.type === 'nps')
    const ratingQ = questions.find(q => q.type === 'rating')
    const nps = npsQ ? parseInt(answers[npsQ.id]) : null
    const rating = ratingQ ? parseInt(answers[ratingQ.id]) : null
    let sentiment = 'neutral'
    if ((rating !== null && rating >= 4) || (nps !== null && nps >= 9)) sentiment = 'positive'
    else if ((rating !== null && rating <= 2) || (nps !== null && nps <= 6)) sentiment = 'negative'

    const res = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        survey_id: surveyId,
        answers,
        nps_score: nps,
        sentiment,
        device_type: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        completed: true
      })
    })
    setSubmitting(false)
    if (res.ok) setSubmitted(true)
    else { const e = await res.text(); alert('Error: ' + e) }
  }

  const color = survey?.accent_color || '#4F46E5'
  const questions: Question[] = survey?.questions || []
  const progress = questions.length > 0 ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:44,height:44,border:'4px solid #E4E7EE',borderTopColor:'#4F46E5',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}></div>
        <p style={{color:'#7C8494',fontFamily:'system-ui,sans-serif'}}>Loading survey...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5'}}>
      <div style={{textAlign:'center',padding:20}}>
        <div style={{fontSize:56,marginBottom:12}}>🔍</div>
        <h2 style={{fontFamily:'system-ui,sans-serif',fontSize:22,fontWeight:800,marginBottom:8}}>Survey not found</h2>
        <p style={{color:'#7C8494',fontSize:14}}>This survey may have been closed or the link is incorrect.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5',padding:20}}>
      <div style={{background:'white',borderRadius:16,padding:48,maxWidth:480,width:'100%',textAlign:'center',boxShadow:'0 12px 32px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <h2 style={{fontFamily:'system-ui,sans-serif',fontSize:24,fontWeight:800,marginBottom:8,color:'#0D0F14'}}>Thank you!</h2>
        <p style={{color:'#7C8494',lineHeight:1.6,marginBottom:24}}>Your response has been submitted successfully.</p>
        <div style={{background:'#F7F8FA',borderRadius:10,padding:'12px 20px',fontSize:13,color:'#7C8494'}}>
          Powered by <strong style={{color:'#4F46E5'}}>InsightIQ</strong> · Rentabuka Solutions
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5',paddingBottom:40}}>
      <div style={{background:color,padding:'32px 20px',color:'white'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          {survey.company_name && <div style={{fontSize:11,opacity:0.7,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{survey.company_name}</div>}
          <h1 style={{fontFamily:'system-ui,sans-serif',fontSize:26,fontWeight:800,marginBottom:6}}>{survey.title}</h1>
          {survey.description && <p style={{fontSize:14,opacity:0.8}}>{survey.description}</p>}
          <div style={{marginTop:14,background:'rgba(255,255,255,0.2)',height:4,borderRadius:2}}>
            <div style={{width:`${progress}%`,height:'100%',background:'rgba(255,255,255,0.85)',borderRadius:2,transition:'width 0.3s'}}></div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:'0 auto',padding:'24px 20px 0'}}>
        {questions.map((q, idx) => (
          <div key={q.id} style={{background:'white',borderRadius:12,padding:24,marginBottom:16,border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`}}>
            <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'flex-start'}}>
              <span style={{background:color,color:'white',width:26,height:26,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{idx+1}</span>
              <span style={{fontFamily:'system-ui,sans-serif',fontSize:15,fontWeight:600,color:'#0D0F14',lineHeight:1.4}}>
                {q.text}{q.required && <span style={{color:'#EF4444',marginLeft:4}}>*</span>}
              </span>
            </div>
            {errors[q.id] && <div style={{background:'#FEF2F2',color:'#EF4444',fontSize:12,padding:'6px 10px',borderRadius:6,marginBottom:10}}>This question is required</div>}

            {q.type === 'rating' && <>
              <div style={{display:'flex',gap:8}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setAnswer(q.id, n)}
                    style={{width:52,height:52,border:'1.5px solid',borderColor:answers[q.id]===n?color:'#E4E7EE',borderRadius:10,background:answers[q.id]===n?color:'white',color:answers[q.id]===n?'white':'#0D0F14',fontSize:16,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'system-ui,sans-serif'}}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}>
                <span>Very poor</span><span>Excellent</span>
              </div>
            </>}

            {q.type === 'nps' && <>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => setAnswer(q.id, n)}
                    style={{width:46,height:46,border:'1.5px solid',borderColor:answers[q.id]===n?color:'#E4E7EE',borderRadius:8,background:answers[q.id]===n?color:'white',color:answers[q.id]===n?'white':'#0D0F14',fontSize:14,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'system-ui,sans-serif'}}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}>
                <span>Not at all likely</span><span>Extremely likely</span>
              </div>
            </>}

            {q.type === 'single' && q.choices.map((c, i) => (
              <label key={i} onClick={() => setAnswer(q.id, c)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:'1.5px solid',borderColor:answers[q.id]===c?color:'#E4E7EE',borderRadius:10,cursor:'pointer',marginBottom:8,background:answers[q.id]===c?`${color}10`:'white',transition:'all 0.15s'}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${answers[q.id]===c?color:'#C7D2FE'}`,background:answers[q.id]===c?color:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {answers[q.id]===c && <div style={{width:6,height:6,borderRadius:'50%',background:'white'}}></div>}
                </div>
                <span style={{fontFamily:'system-ui,sans-serif',fontSize:14,color:'#3A3F4B'}}>{c}</span>
              </label>
            ))}

            {q.type === 'multiple' && q.choices.map((c, i) => {
              const sel = (answers[q.id] || []).includes(c)
              return (
                <label key={i} onClick={() => toggleChoice(q.id, c)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:'1.5px solid',borderColor:sel?color:'#E4E7EE',borderRadius:10,cursor:'pointer',marginBottom:8,background:sel?`${color}10`:'white',transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?color:'#C7D2FE'}`,background:sel?color:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {sel && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontFamily:'system-ui,sans-serif',fontSize:14,color:'#3A3F4B'}}>{c}</span>
                </label>
              )
            })}

            {q.type === 'text' && (
              <input type="text" placeholder="Your answer..." value={answers[q.id] || ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`,borderRadius:8,fontSize:14,fontFamily:'system-ui,sans-serif',outline:'none',boxSizing:'border-box'}}/>
            )}

            {q.type === 'longtext' && (
              <textarea placeholder="Your answer..." value={answers[q.id] || ''} rows={4}
                onChange={e => setAnswer(q.id, e.target.value)}
                style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${errors[q.id]?'#EF4444':'#E4E7EE'}`,borderRadius:8,fontSize:14,fontFamily:'system-ui,sans-serif',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
            )}
          </div>
        ))}

        <button type="button" onClick={handleSubmit} disabled={submitting}
          style={{width:'100%',padding:16,background:submitting?'#818CF8':color,color:'white',border:'none',borderRadius:10,fontSize:16,fontWeight:700,cursor:submitting?'not-allowed':'pointer',fontFamily:'system-ui,sans-serif',marginTop:8}}>
          {submitting ? 'Submitting...' : 'Submit Survey →'}
        </button>
        <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#B0B8C8'}}>
          Powered by <strong style={{color:'#4F46E5'}}>InsightIQ</strong> · Rentabuka Solutions
        </div>
      </div>
    </div>
  )
}
