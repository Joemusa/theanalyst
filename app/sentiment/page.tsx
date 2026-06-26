'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

export default function SentimentPage() {
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: surveys } = await supabase.from('surveys').select('id').eq('user_id', session.user.id)
      const ids = surveys?.map((s:any)=>s.id)||[]
      if (ids.length>0) {
        const { data } = await supabase.from('responses').select('*').in('survey_id', ids).order('submitted_at',{ascending:false})
        setResponses(data||[])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{display:'flex'}}><Sidebar active="sentiment"/><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontFamily:'system-ui',color:'#7C8494'}}>Loading...</p></div></div>

  const positive = responses.filter(r=>r.sentiment==='positive')
  const neutral = responses.filter(r=>r.sentiment==='neutral')
  const negative = responses.filter(r=>r.sentiment==='negative')
  const total = responses.length

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="sentiment"/>
      <div style={{flex:1,background:'#F7F8FA'}}>
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center'}}>
          <h1 style={{fontSize:18,fontWeight:800,fontFamily:'system-ui'}}>Sentiment Analysis</h1>
        </div>
        <div style={{padding:28}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
            {[
              {label:'Positive',value:positive.length,pct:total>0?Math.round(positive.length/total*100):0,color:'#10B981',bg:'#ECFDF5',emoji:'😊'},
              {label:'Neutral',value:neutral.length,pct:total>0?Math.round(neutral.length/total*100):0,color:'#F59E0B',bg:'#FEF9C3',emoji:'😐'},
              {label:'Negative',value:negative.length,pct:total>0?Math.round(negative.length/total*100):0,color:'#EF4444',bg:'#FEF2F2',emoji:'😞'},
            ].map(({label,value,pct,color,bg,emoji})=>(
              <div key={label} style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{fontSize:24}}>{emoji}</span>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:'system-ui',color:'#0D0F14'}}>{label}</span>
                </div>
                <div style={{fontSize:36,fontWeight:800,fontFamily:'system-ui',color}}>{pct}%</div>
                <div style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui',marginTop:4}}>{value} responses</div>
                <div style={{marginTop:12,height:6,background:'#F0F2F7',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.5s'}}></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16,fontFamily:'system-ui'}}>Recent Responses by Sentiment</div>
            {responses.length === 0 ? (
              <div style={{textAlign:'center',padding:32,color:'#7C8494'}}>
                <div style={{fontSize:32,marginBottom:8}}>📊</div>
                <p style={{fontFamily:'system-ui'}}>No responses yet</p>
              </div>
            ) : responses.slice(0,20).map((r:any,i:number)=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #F0F2F7'}}>
                <span style={{fontSize:18}}>{r.sentiment==='positive'?'😊':r.sentiment==='negative'?'😞':'😐'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>{new Date(r.submitted_at).toLocaleString('en-ZA')}</div>
                </div>
                {r.nps_score!==null&&<span style={{fontSize:12,background:'#EEF2FF',color:'#4F46E5',padding:'2px 8px',borderRadius:100,fontFamily:'system-ui',fontWeight:600}}>NPS: {r.nps_score}</span>}
                <span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:100,fontFamily:'system-ui',background:r.sentiment==='positive'?'#ECFDF5':r.sentiment==='negative'?'#FEF2F2':'#FEF9C3',color:r.sentiment==='positive'?'#10B981':r.sentiment==='negative'?'#EF4444':'#92400E'}}>{r.sentiment||'neutral'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
