'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar({ active }: { active: string }) {
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.href = '/login'
  }

  const navItems = [
    { section: 'OVERVIEW', items: [
      { icon: '🏠', label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
    ]},
    { section: 'SURVEYS', items: [
      { icon: '📋', label: 'My Surveys', href: '/surveys', key: 'surveys' },
      { icon: '✏️', label: 'Survey Builder', href: '/surveys/new', key: 'builder' },
      { icon: '💬', label: 'Responses', href: '/responses', key: 'responses' },
      { icon: '📤', label: 'Distribution', href: '/distribution', key: 'distribution' },
    ]},
    { section: 'AI ANALYTICS', items: [
      { icon: '✨', label: 'AI Insights', href: '/insights', key: 'insights' },
      { icon: '😊', label: 'Sentiment', href: '/sentiment', key: 'sentiment' },
      { icon: '🤖', label: 'Ask Your Data', href: '/ask-ai', key: 'ask-ai' },
    ]},
    { section: 'ACCOUNT', items: [
      { icon: '💳', label: 'Subscription', href: '/subscription', key: 'subscription' },
    ]},
  ]

  return (
    <div style={{width:220,background:'#1E1B4B',minHeight:'100vh',display:'flex',flexDirection:'column',flexShrink:0}}>
      {/* Logo */}
      <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <svg width="34" height="34" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="14" fill="#4F46E5"/>
            <rect x="12" y="42" width="8" height="14" rx="2" fill="rgba(255,255,255,0.35)"/>
            <rect x="26" y="32" width="8" height="24" rx="2" fill="rgba(255,255,255,0.65)"/>
            <rect x="40" y="20" width="8" height="36" rx="2" fill="rgba(255,255,255,0.95)"/>
            <circle cx="54" cy="14" r="7" fill="#10B981"/>
            <circle cx="54" cy="14" r="3.5" fill="white"/>
          </svg>
          <div>
            <div style={{color:'white',fontWeight:800,fontSize:15,fontFamily:'system-ui',lineHeight:1.2}}>InsightIQ</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontFamily:'system-ui',letterSpacing:'0.03em'}}>by Rentabuka Solutions</div>
          </div>
        </a>
      </div>

      {/* Nav */}
      <div style={{flex:1,padding:'12px 8px',overflowY:'auto',scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent'}}>
        {navItems.map(section => (
          <div key={section.section} style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',padding:'8px 8px 4px',fontFamily:'system-ui'}}>{section.section}</div>
            {section.items.map(item => (
              <a key={item.key} href={item.href}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,textDecoration:'none',marginBottom:2,background:active===item.key?'rgba(255,255,255,0.12)':'none',borderRight:active===item.key?'3px solid #10B981':'3px solid transparent',transition:'background 0.1s'}}>
                <span style={{fontSize:14,width:20,textAlign:'center'}}>{item.icon}</span>
                <span style={{fontSize:13,fontWeight:active===item.key?600:400,color:active===item.key?'white':'rgba(255,255,255,0.6)',fontFamily:'system-ui'}}>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={handleSignOut}
          style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',borderRadius:8,fontFamily:'system-ui',marginBottom:8}}>
          <span style={{fontSize:14}}>🚪</span>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Sign out</span>
        </button>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontFamily:'system-ui',textAlign:'center',lineHeight:1.4}}>
          Powered by Rentabuka Solutions
        </div>
      </div>
    </div>
  )
}
