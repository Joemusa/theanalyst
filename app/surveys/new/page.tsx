'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const QUESTION_TYPES = [
  { key: 'rating', label: 'Rating Scale', icon: '★' },
  { key: 'nps', label: 'Net Promoter', icon: 'NPS' },
  { key: 'single', label: 'Single Choice', icon: '◉' },
  { key: 'multiple', label: 'Multiple Choice', icon: '☑' },
  { key: 'text', label: 'Short Text', icon: 'Aa' },
  { key: 'longtext', label: 'Long Text', icon: '¶' },
]

type Question = { id: number; type: string; text: string; required: boolean; choices: string[] }

export default function NewSurveyPage() {
  const [title, setTitle] = useState('Untitled Survey')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: 'rating', text: 'How would you rate your overall experience?', required: true, choices: [] }
  ])
  const [selectedId, setSelectedId] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const supabase = createClient()

  function addQuestion(type: string) {
    const defaults: Record<string, string> = {
      rating: 'How would you rate...?', nps: 'How likely are you to recommend us?',
      single: 'Select one option:', multiple: 'Select all that apply:',
      text: 'Your question here', longtext: 'Your question here',
    }
    const newQ: Question = {
      id: Date.now(), type, text: defaults[type] || 'New question', required: false,
      choices: ['single','multiple'].includes(type) ? ['Option 1','Option 2','Option 3'] : []
    }
    setQuestions(prev => [...prev, newQ])
    setSelectedId(newQ.id)
  }

  function updateQuestion(id: number, field: string, value: any) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  function deleteQuestion(id: number) {
    if (questions.length <= 1) return
    const remaining = questions.filter(q => q.id !== id)
    setQuestions(remaining)
    setSelectedId(remaining[0].id)
  }

  function selectRating(questionId: number, value: number) {
    setRatings(prev => ({ ...prev, [questionId]: value }))
  }

  async function saveSurvey(status: 'draft' | 'active') {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { error } = await supabase.from('surveys').insert({
      user_id: session.user.id, title, description, status, questions,
      published_at: status === 'active' ? new Date().toISOString() : null,
    })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => window.location.href = '/dashboard', 1500) }
    else alert('Error saving: ' + error.message)
  }

  const selected = questions.find(q => q.id === selectedId)
  const accentColor = '#4F46E5'

  if (saved) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F8FA'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:16}}>✅</div>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:8}}>Survey saved!</h2>
        <p style={{color:'#7C8494'}}>Redirecting to dashboard...</p>
      </div>
    </div>
  )

  // PREVIEW MODE
  if (previewing) return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 24px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{background:'#ECFDF5',color:'#065F46',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100}}>Preview Mode</span>
          <span style={{fontSize:13,color:'#7C8494'}}>This is how respondents see your survey</span>
        </div>
        <button onClick={() => setPreviewing(false)} style={{padding:'7px 16px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          ← Back to Editor
        </button>
      </div>
      <div style={{maxWidth:680,margin:'32px auto',padding:'0 16px'}}>
        <div style={{background:accentColor,borderRadius:'12px 12px 0 0',padding:32,color:'white'}}>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:6}}>{title || 'Untitled Survey'}</h2>
          <p style={{fontSize:14,opacity:0.8}}>{description || 'Help us serve you better'}</p>
          <div style={{marginTop:16,background:'rgba(255,255,255,0.2)',height:4,borderRadius:2}}>
            <div style={{width:'10%',height:'100%',background:'rgba(255,255,255,0.8)',borderRadius:2}}></div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:'0 0 12px 12px',padding:24,display:'flex',flexDirection:'column',gap:16}}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{background:'white',border:'1.5px solid #E4E7EE',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <span style={{background:accentColor,color:'white',width:24,height:24,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                <span style={{fontSize:14,fontWeight:600,color:'#0D0F14'}}>{q.text}</span>
                {q.required&&<span style={{color:'#EF4444',fontSize:12}}>*</span>}
              </div>
              {q.type==='rating'&&<>
                <div style={{display:'flex',gap:8}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>selectRating(q.id,n)}
                      style={{width:48,height:48,border:'1.5px solid',borderColor:ratings[q.id]===n?accentColor:'#E4E7EE',borderRadius:8,background:ratings[q.id]===n?accentColor:'white',color:ratings[q.id]===n?'white':'#0D0F14',fontSize:15,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit'}}>
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}>
                  <span>Very poor</span><span>Excellent</span>
                </div>
              </>}
              {q.type==='nps'&&<>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>selectRating(q.id,n)}
                      style={{width:44,height:44,border:'1.5px solid',borderColor:ratings[q.id]===n?accentColor:'#E4E7EE',borderRadius:8,background:ratings[q.id]===n?accentColor:'white',color:ratings[q.id]===n?'white':'#0D0F14',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit'}}>
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}>
                  <span>Not at all likely</span><span>Extremely likely</span>
                </div>
              </>}
              {q.type==='single'&&q.choices.map((c,i)=>(
                <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1.5px solid #E4E7EE',borderRadius:8,cursor:'pointer',marginBottom:6,fontSize:14,color:'#3A3F4B'}}>
                  <input type="radio" name={`q${q.id}`} style={{accentColor}}/> {c}
                </label>
              ))}
              {q.type==='multiple'&&q.choices.map((c,i)=>(
                <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1.5px solid #E4E7EE',borderRadius:8,cursor:'pointer',marginBottom:6,fontSize:14,color:'#3A3F4B'}}>
                  <input type="checkbox" style={{accentColor}}/> {c}
                </label>
              ))}
              {q.type==='text'&&<input type="text" placeholder="Your answer..." style={{width:'100%',padding:'10px 14px',border:'1.5px solid #E4E7EE',borderRadius:8,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>}
              {q.type==='longtext'&&<textarea placeholder="Your answer..." rows={3} style={{width:'100%',padding:'10px 14px',border:'1.5px solid #E4E7EE',borderRadius:8,fontSize:14,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>}
            </div>
          ))}
          <button style={{width:'100%',padding:14,background:accentColor,color:'white',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            Submit Survey
          </button>
        </div>
      </div>
    </div>
  )

  // BUILDER MODE
  return (
    <div style={{height:'100vh',background:'#F7F8FA',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/dashboard" style={{color:'#7C8494',textDecoration:'none',fontSize:13}}>← Dashboard</a>
          <span style={{color:'#E4E7EE'}}>/</span>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{border:'none',outline:'none',fontSize:15,fontWeight:700,color:'#0D0F14',background:'transparent',minWidth:200,fontFamily:'inherit'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={() => setPreviewing(true)}
            style={{padding:'7px 16px',background:'white',border:'1px solid #E4E7EE',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            👁 Preview
          </button>
          <button onClick={() => saveSurvey('draft')} disabled={saving}
            style={{padding:'7px 16px',background:'white',border:'1px solid #E4E7EE',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
          <button onClick={() => saveSurvey('active')} disabled={saving}
            style={{padding:'7px 16px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            🚀 Publish Survey
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'190px 1fr 260px',flex:1,overflow:'hidden'}}>
        <div style={{background:'white',borderRight:'1px solid #E4E7EE',padding:'16px 8px',overflowY:'auto'}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',padding:'0 8px 8px'}}>Question Types</div>
          {QUESTION_TYPES.map(t => (
            <button key={t.key} onClick={() => addQuestion(t.key)}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#3A3F4B',borderRadius:6,textAlign:'left',marginBottom:2,fontFamily:'inherit'}}
              onMouseOver={e => (e.currentTarget.style.background='#F7F8FA')}
              onMouseOut={e => (e.currentTarget.style.background='none')}>
              <span style={{width:28,height:28,background:'#EEF2FF',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#4F46E5',flexShrink:0}}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:24,overflowY:'auto'}}>
          <div style={{background:'#4F46E5',borderRadius:'12px 12px 0 0',padding:24,color:'white'}}>
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={{background:'transparent',border:'none',outline:'none',fontSize:22,fontWeight:800,color:'white',width:'100%',marginBottom:6,fontFamily:'inherit'}}/>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a description..."
              style={{background:'transparent',border:'none',outline:'none',fontSize:14,color:'rgba(255,255,255,0.7)',width:'100%',fontFamily:'inherit'}}/>
          </div>
          <div style={{background:'white',borderRadius:'0 0 12px 12px',padding:16,marginBottom:12}}>
            {questions.map((q, idx) => (
              <div key={q.id} onClick={() => setSelectedId(q.id)}
                style={{border:`2px solid ${q.id===selectedId?'#4F46E5':'#E4E7EE'}`,borderRadius:10,padding:16,marginBottom:12,cursor:'pointer',background:q.id===selectedId?'#FAFAFA':'white'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{background:'#4F46E5',color:'white',width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                  <span style={{fontSize:14,fontWeight:600,flex:1,color:'#0D0F14'}}>{q.text}</span>
                  <span style={{fontSize:11,background:'#EEF2FF',color:'#4F46E5',padding:'2px 8px',borderRadius:100,fontWeight:600,whiteSpace:'nowrap'}}>{QUESTION_TYPES.find(t=>t.key===q.type)?.label}</span>
                  <button onClick={e=>{e.stopPropagation();deleteQuestion(q.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'#7C8494',fontSize:20,lineHeight:1,padding:'0 4px'}}>×</button>
                </div>
                {q.type==='rating'&&<>
                  <div style={{display:'flex',gap:6}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={e=>{e.stopPropagation();selectRating(q.id,n)}}
                        style={{width:40,height:40,border:'1.5px solid',borderColor:ratings[q.id]===n?'#4F46E5':'#E4E7EE',borderRadius:8,background:ratings[q.id]===n?'#4F46E5':'white',color:ratings[q.id]===n?'white':'#0D0F14',fontSize:14,fontWeight:600,cursor:'pointer',transition:'all 0.1s',fontFamily:'inherit'}}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}><span>Very poor</span><span>Excellent</span></div>
                </>}
                {q.type==='nps'&&<>
                  <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <button key={n} onClick={e=>{e.stopPropagation();selectRating(q.id,n)}}
                        style={{width:36,height:36,border:'1.5px solid',borderColor:ratings[q.id]===n?'#4F46E5':'#E4E7EE',borderRadius:6,background:ratings[q.id]===n?'#4F46E5':'white',color:ratings[q.id]===n?'white':'#0D0F14',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.1s',fontFamily:'inherit'}}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#7C8494'}}><span>Not at all likely</span><span>Extremely likely</span></div>
                </>}
                {(q.type==='single'||q.type==='multiple')&&q.choices.map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid #F0F2F7'}}><input type={q.type==='single'?'radio':'checkbox'} readOnly/><span style={{fontSize:13}}>{c}</span></div>)}
                {q.type==='text'&&<input readOnly placeholder="Short answer..." style={{width:'100%',padding:'8px 12px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,background:'#F7F8FA'}}/>}
                {q.type==='longtext'&&<textarea readOnly placeholder="Long answer..." rows={3} style={{width:'100%',padding:'8px 12px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,background:'#F7F8FA',resize:'none'}}/>}
              </div>
            ))}
            <button onClick={() => addQuestion('text')} style={{width:'100%',padding:12,background:'#EEF2FF',border:'2px dashed #C7D2FE',borderRadius:10,fontSize:13,fontWeight:600,color:'#4F46E5',cursor:'pointer',fontFamily:'inherit'}}>
              + Add Question
            </button>
          </div>
        </div>

        <div style={{background:'white',borderLeft:'1px solid #E4E7EE',padding:16,overflowY:'auto'}}>
          {selected ? <>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',marginBottom:12}}>Question Settings</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#7C8494',marginBottom:4}}>Question Text</label>
              <textarea value={selected.text} rows={3} onChange={e => updateQuestion(selected.id,'text',e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,resize:'vertical',fontFamily:'inherit'}}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#7C8494',marginBottom:4}}>Question Type</label>
              <select value={selected.type} onChange={e => updateQuestion(selected.id,'type',e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'inherit'}}>
                {QUESTION_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer',marginBottom:16}}>
              <input type="checkbox" checked={selected.required} onChange={e => updateQuestion(selected.id,'required',e.target.checked)} style={{accentColor:'#4F46E5'}}/>
              Required question
            </label>
            {(selected.type==='single'||selected.type==='multiple')&&<div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#7C8494',marginBottom:6}}>Choices</label>
              {selected.choices.map((c,i)=>(
                <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                  <input value={c} onChange={e=>{const ch=[...selected.choices];ch[i]=e.target.value;updateQuestion(selected.id,'choices',ch)}}
                    style={{flex:1,padding:'6px 8px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
                  <button onClick={()=>{if(selected.choices.length>1){const ch=selected.choices.filter((_,j)=>j!==i);updateQuestion(selected.id,'choices',ch)}}}
                    style={{background:'none',border:'1px solid #E4E7EE',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#7C8494'}}>×</button>
                </div>
              ))}
              <button onClick={()=>updateQuestion(selected.id,'choices',[...selected.choices,'New option'])}
                style={{width:'100%',padding:'6px',background:'#F7F8FA',border:'1px dashed #C7D2FE',borderRadius:6,fontSize:12,color:'#4F46E5',cursor:'pointer',marginTop:4,fontFamily:'inherit'}}>
                + Add choice
              </button>
            </div>}
            <div style={{borderTop:'1px solid #E4E7EE',marginTop:16,paddingTop:16,display:'flex',gap:8}}>
              <button onClick={()=>{const copy={...selected,id:Date.now(),text:selected.text+' (copy)',choices:[...selected.choices]};setQuestions(prev=>[...prev,copy]);setSelectedId(copy.id)}}
                style={{flex:1,padding:'8px',background:'#F7F8FA',border:'1px solid #E4E7EE',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>⧉ Duplicate</button>
              <button onClick={()=>deleteQuestion(selected.id)}
                style={{flex:1,padding:'8px',background:'#FEF2F2',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,fontSize:12,fontWeight:600,color:'#EF4444',cursor:'pointer',fontFamily:'inherit'}}>🗑 Delete</button>
            </div>
          </> : <p style={{color:'#7C8494',fontSize:13}}>Click a question to edit it</p>}
          <div style={{borderTop:'1px solid #E4E7EE',marginTop:24,paddingTop:16}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7C8494',marginBottom:12}}>Survey Settings</div>
            <div style={{marginBottom:10}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#7C8494',marginBottom:4}}>Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',padding:'7px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'inherit'}}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#7C8494',marginBottom:4}}>Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}
                style={{width:'100%',padding:'7px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,resize:'vertical',fontFamily:'inherit'}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
