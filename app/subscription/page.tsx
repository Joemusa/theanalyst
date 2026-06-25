'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string|null>(null)

  async function handleUpgrade(plan: string, amount: string) {
    setLoading(plan)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const paymentId = 'INS-' + Date.now().toString(36).toUpperCase()
    const appUrl = 'https://theanalyst-one.vercel.app'
    const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '10000100'
    const merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || '46f0cd694581a'
    const isSandbox = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX !== 'false'

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = isSandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process'
    form.style.display = 'none'

    const fields: Record<string,string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/payment/success?plan=${plan}&pid=${paymentId}`,
      cancel_url: `${appUrl}/subscription?payment=cancelled`,
      notify_url: `${appUrl}/api/payfast/itn`,
      name_first: user.email?.split('@')[0] ?? 'User',
      name_last: 'InsightHub',
      email_address: user.email ?? '',
      m_payment_id: paymentId,
      amount: amount,
      item_name: `InsightHub AI — ${plan} Plan`,
      subscription_type: '1',
      billing_date: new Date().toISOString().split('T')[0],
      recurring_amount: amount,
      frequency: '3',
      cycles: '0',
      custom_str1: plan,
      custom_str2: 'insighthub_ai',
      custom_str3: user.email ?? '',
    }

    Object.entries(fields).forEach(([k,v]) => {
      const i = document.createElement('input')
      i.type = 'hidden'; i.name = k; i.value = v
      form.appendChild(i)
    })
    document.body.appendChild(form)
    form.submit()
  }

  const plans = [

    { key: 'starter', name: 'Starter', price: 'R299', amount: '299.00', desc: 'Perfect for small businesses', color: '#4F46E5', recommended: false,
      features: ['5 surveys','500 responses/month','Basic AI summaries','PDF reports','Email & WhatsApp distribution'],
      locked: ['Market Segmentation','Forecasting','Churn Prediction'] },
    { key: 'professional', name: 'Professional', price: 'R999', amount: '999.00', desc: 'Full AI analytics suite', color: '#7C3AED', recommended: true,
      features: ['Unlimited surveys','Unlimited responses','Advanced AI Insights','Market Segmentation','Persona Generation','Forecasting Engine','Churn Prediction','Basket Analysis','PDF + PowerPoint + Excel'],
      locked: [] },
    { key: 'enterprise', name: 'Enterprise', price: 'Custom', amount: '0', desc: 'White-label & dedicated support', color: '#0D0F14', recommended: false,
      features: ['Everything in Professional','White-label branding','API access','SSO','Dedicated account manager','Custom AI models'],
      locked: [] },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#F7F8FA'}}>
      <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/dashboard" style={{fontWeight:700,fontSize:18,textDecoration:'none',color:'#0D0F14'}}>📊 InsightHub AI</a>
        <a href="/dashboard" style={{fontSize:13,color:'#4F46E5',fontWeight:600,textDecoration:'none'}}>← Back to dashboard</a>
      </div>
      <div style={{padding:'48px 32px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h1 style={{fontSize:36,fontWeight:800,marginBottom:8}}>Choose your plan</h1>
          <p style={{color:'#7C8494',fontSize:16}}>Upgrade and keep all your data and insights</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:24}}>
          {plans.map(plan => (
            <div key={plan.key} style={{background:'white',borderRadius:16,border:plan.recommended?`2px solid ${plan.color}`:'1.5px solid #E4E7EE',padding:28,position:'relative',boxShadow:plan.recommended?`0 0 0 4px ${plan.color}20`:'none'}}>
              {plan.recommended && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:plan.color,color:'white',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:100,textTransform:'uppercase',whiteSpace:'nowrap'}}>⚡ Most Popular</div>}
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{plan.name}</div>
              <div style={{marginBottom:16}}><span style={{fontSize:36,fontWeight:800}}>{plan.price}</span>{plan.price!=='Custom'&&<span style={{fontSize:14,color:'#7C8494'}}>/month</span>}</div>
              <div style={{fontSize:13,color:'#7C8494',marginBottom:24}}>{plan.desc}</div>
              {plan.key==='enterprise'
                ? <button onClick={() => window.location.href = 'mailto:sales@rentabuka.co.za?subject=InsightHub AI Enterprise Enquiry'} style={{width:'100%',padding:'11px',background:'#F7F8FA',color:'#0D0F14',border:'1.5px solid #E4E7EE',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:24}}>Contact Sales</button>
                : <button onClick={()=>handleUpgrade(plan.key,plan.amount)} disabled={loading===plan.key} style={{width:'100%',padding:'11px',background:loading===plan.key?'#818CF8':plan.color,color:'white',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:loading===plan.key?'not-allowed':'pointer',marginBottom:24}}>{loading===plan.key?'Redirecting...':`Pay ${plan.price}/month`}</button>
              }
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {plan.features.map(f=><div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#3A3F4B'}}><span style={{color:'#10B981',fontWeight:700,flexShrink:0}}>✓</span>{f}</div>)}
                {plan.locked.map(f=><div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#B0B8C8'}}><span style={{flexShrink:0}}>✗</span>{f}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:32,fontSize:13,color:'#7C8494'}}>All plans · Cancel anytime · South African Rand (ZAR) · VAT exclusive</div>
      </div>
    </div>
  )
}
