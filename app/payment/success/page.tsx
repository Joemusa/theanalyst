'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')
  const [plan, setPlan] = useState('')
  const supabase = createClient()
  useEffect(() => {
    async function run() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { window.location.href = '/login'; return }
        const params = new URLSearchParams(window.location.search)
        const p = params.get('plan') ?? 'starter'
        const pid = 'INS-' + Date.now()
        setPlan(p)
        await supabase.from('profiles').update({ plan: p }).eq('id', session.user.id)
        await supabase.from('payments').insert({ user_id: session.user.id, payfast_payment_id: pid, m_payment_id: pid, amount: p === 'professional' ? 999 : 299, item_name: 'InsightHub AI ' + p, payment_status: 'COMPLETE', itn_raw: { plan: p } })
        await supabase.from('subscriptions').insert({ user_id: session.user.id, plan: p, status: 'active', amount_cents: p === 'professional' ? 99900 : 29900, payfast_payment_id: pid, current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString() })
        setStatus('success')
        setTimeout(() => { window.location.href = '/dashboard' }, 3000)
      } catch(e) { setStatus('error') }
    }
    run()
  }, [])
  if (status === 'loading') return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:48}}>⏳</div><h2>Activating your plan...</h2></div></div>
  if (status === 'error') return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:48}}>⚠️</div><h2>Something went wrong</h2><a href="/dashboard">Go to dashboard</a></div></div>
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F8FA'}}>
      <div style={{background:'white',borderRadius:16,padding:48,maxWidth:480,width:'100%',textAlign:'center',boxShadow:'0 12px 32px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <h2 style={{fontSize:26,fontWeight:800,marginBottom:8}}>Payment Successful!</h2>
        <p style={{color:'#7C8494',marginBottom:24}}>Your <strong style={{color:'#4F46E5',textTransform:'capitalize'}}>{plan}</strong> plan is now active.</p>
        <div style={{background:'#ECFDF5',borderRadius:12,padding:20,marginBottom:28}}>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #D1FAE5',fontSize:14}}><span style={{color:'#7C8494'}}>Plan</span><strong style={{textTransform:'capitalize'}}>{plan}</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #D1FAE5',fontSize:14}}><span style={{color:'#7C8494'}}>Amount</span><strong>{plan==='professional'?'R999':'R299'}/month</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:14}}><span style={{color:'#7C8494'}}>Status</span><strong style={{color:'#10B981'}}>✓ Active</strong></div>
        </div>
        <p style={{fontSize:13,color:'#7C8494',marginBottom:16}}>Redirecting to dashboard in 3 seconds...</p>
        <a href="/dashboard" style={{background:'#4F46E5',color:'white',padding:'12px 32px',borderRadius:8,textDecoration:'none',fontSize:15,fontWeight:700}}>Go to dashboard now →</a>
      </div>
    </div>
  )
}
