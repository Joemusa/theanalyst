'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

export default function AskAIPage() {
  const [messages, setMessages] = useState<{role:string,content:string}[]>([
    {role:'assistant',content:'Hi! I\'m your InsightIQ AI assistant. Ask me anything about your survey data — sentiment trends, customer insights, recommendations, or what to focus on next.'}
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [surveys, setSurveys] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: sv } = await supabase.from('surveys').select('*').eq('user_id', session.user.id)
      setSurveys(sv||[])
      const ids = sv?.map((s:any)=>s.id)||[]
      if (ids.length>0) {
        const { data: r } = await supabase.from('responses').select('*').in('survey_id', ids).limit(100)
        setResponses(r||[])
      }
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)

    const userMsg = {role:'user',content:text}
    setMessages(prev => [...prev, userMsg])

    const apiKey = localStorage.getItem('anthropic_api_key') || ''
    if (!apiKey) {
      setMessages(prev => [...prev, {role:'assistant',content:'⚠️ Please add your Anthropic API key in Settings to use AI chat.'}])
      setLoading(false)
      return
    }

    const context = `You are InsightIQ AI assistant. Here is the user's survey data:
Surveys: ${JSON.stringify(surveys.map(s=>({title:s.title,responses:s.response_count,status:s.status})))}
Total responses: ${responses.length}
Sentiment: Positive ${responses.filter(r=>r.sentiment==='positive').length}, Neutral ${responses.filter(r=>r.sentiment==='neutral').length}, Negative ${responses.filter(r=>r.sentiment==='negative').length}
NPS scores: ${responses.filter(r=>r.nps_score!==null).map(r=>r.nps_score).join(',')}
Answer in plain English, be concise and actionable. Max 150 words.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:512,system:context,messages:[...messages,userMsg].filter(m=>m.role!=='assistant'||messages.indexOf(m)>0).map(m=>({role:m.role,content:m.content}))})
      })
      const data = await res.json()
      setMessages(prev=>[...prev,{role:'assistant',content:data.content?.[0]?.text||'Sorry, I could not generate a response.'}])
    } catch {
      setMessages(prev=>[...prev,{role:'assistant',content:'Error connecting to AI. Please check your API key.'}])
    }
    setLoading(false)
  }

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="ask-ai"/>
      <div style={{flex:1,background:'#F7F8FA',display:'flex',flexDirection:'column'}}>
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontSize:18,fontWeight:800,fontFamily:'system-ui'}}>Ask Your Data</h1>
          <span style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui'}}>{responses.length} responses analysed</span>
        </div>

        {/* Messages */}
        <div style={{flex:1,padding:24,overflowY:'auto',display:'flex',flexDirection:'column',gap:16}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              {m.role==='assistant'&&<div style={{width:32,height:32,borderRadius:'50%',background:'#4F46E5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>🤖</div>}
              <div style={{maxWidth:'70%',padding:'12px 16px',borderRadius:12,background:m.role==='user'?'#4F46E5':'white',color:m.role==='user'?'white':'#0D0F14',fontSize:14,lineHeight:1.6,fontFamily:'system-ui',border:m.role==='assistant'?'1px solid #E4E7EE':'none',boxShadow:m.role==='assistant'?'0 2px 8px rgba(0,0,0,0.04)':'none'}}>
                {m.content}
              </div>
              {m.role==='user'&&<div style={{width:32,height:32,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>👤</div>}
            </div>
          ))}
          {loading&&<div style={{display:'flex',gap:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'#4F46E5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🤖</div>
            <div style={{padding:'12px 16px',background:'white',borderRadius:12,border:'1px solid #E4E7EE',fontSize:14,color:'#7C8494',fontFamily:'system-ui'}}>Thinking...</div>
          </div>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick questions */}
        <div style={{padding:'0 24px 8px',display:'flex',gap:8,flexWrap:'wrap'}}>
          {['What are the main issues?','What do customers love most?','Give me 3 quick wins','Who are my best customers?'].map(q=>(
            <button key={q} onClick={()=>{setInput(q)}}
              style={{padding:'6px 12px',background:'white',border:'1px solid #E4E7EE',borderRadius:100,fontSize:12,cursor:'pointer',fontFamily:'system-ui',color:'#3A3F4B'}}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{padding:'12px 24px',background:'white',borderTop:'1px solid #E4E7EE',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
            placeholder="Ask anything about your survey data..."
            style={{flex:1,padding:'10px 16px',border:'1.5px solid #E4E7EE',borderRadius:8,fontSize:14,fontFamily:'system-ui',outline:'none'}}/>
          <button onClick={sendMessage} disabled={!input.trim()||loading}
            style={{width:44,height:44,background:'#4F46E5',border:'none',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
