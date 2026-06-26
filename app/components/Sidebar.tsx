'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar({ active }: { active: string }) {
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
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
        <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:32,height:32,background:'#4F46E5',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 76 76" fill="none"><rect x="8" y="44" width="10" height="20" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="24" y="32" width="10" height="32" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="40" y="18" width="10" height="46" rx="2" fill="white"/><circle cx="60" cy="14" r="8" fill="#10B981"/><circle cx="60" cy="14" r="4" fill="white"/></svg>
          </div>
          <span style={{color:'white',fontWeight:800,fontSize:15,fontFamily:'system-ui'}}>InsightIQ</span>
        </a>
      </div>

      {/* Nav */}
      <div style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        {navItems.map(section => (
          <div key={section.section} style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'0.08em',padding:'8px 8px 4px',fontFamily:'system-ui'}}>{section.section}</div>
            {section.items.map(item => (
              <a key={item.key} href={item.href}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,textDecoration:'none',marginBottom:2,background:active===item.key?'rgba(255,255,255,0.12)':'none',borderRight:active===item.key?'3px solid #10B981':'3px solid transparent'}}>
                <span style={{fontSize:14}}>{item.icon}</span>
                <span style={{fontSize:13,fontWeight:active===item.key?600:400,color:active===item.key?'white':'rgba(255,255,255,0.6)',fontFamily:'system-ui'}}>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={handleSignOut}
          style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',borderRadius:8,fontFamily:'system-ui'}}>
          <span style={{fontSize:14}}>🚪</span>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Sign out</span>
        </button>
      </div>
    </div>
  )
}
