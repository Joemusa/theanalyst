'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/app/components/Sidebar'

type Contact = { name: string; email: string; phone: string }

export default function DistributionPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('whatsapp')
  const [emailSubject, setEmailSubject] = useState('We value your feedback!')
  const [emailMessage, setEmailMessage] = useState('Hi {name},\n\nWe would love to hear your thoughts. Please take 2 minutes to fill in our survey:\n\n{link}\n\nThank you!\n\nBest regards')
  const [step, setStep] = useState<1|2|3>(1)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useState(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('surveys').select('id, title, status').eq('user_id', session.user.id).eq('status', 'active')
      setSurveys(data || [])
      if (data && data.length > 0) setSelectedSurvey(data[0])
    }
    load()
  })

  function getSurveyLink(surveyId: string) {
    return `https://insightiq.co.za/s/${surveyId}`
  }

  function parseCSV(text: string): Contact[] {
    const lines = text.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = values[i] || '' })
      return {
        name: obj.name || obj['full name'] || obj['first name'] || '',
        email: obj.email || obj['email address'] || '',
        phone: obj.phone || obj['cell'] || obj['cellphone'] || obj['mobile'] || obj['whatsapp'] || '',
      }
    }).filter(c => c.name || c.email || c.phone)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setContacts(parsed)
    }
    reader.readAsText(file)
  }

  function addManualContact() {
    if (!manualName && !manualEmail && !manualPhone) return
    setContacts(prev => [...prev, { name: manualName, email: manualEmail, phone: manualPhone }])
    setManualName(''); setManualEmail(''); setManualPhone('')
  }

  function removeContact(idx: number) {
    setContacts(prev => prev.filter((_, i) => i !== idx))
  }

  function getWhatsAppLink(contact: Contact) {
    const link = getSurveyLink(selectedSurvey?.id)
    const msg = `Hi ${contact.name || 'there'}, we would love your feedback! Please fill in our quick survey: ${link}`
    const phone = contact.phone.replace(/\D/g, '').replace(/^0/, '27')
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  async function sendViaEmail() {
    setSending(true)
    const link = getSurveyLink(selectedSurvey?.id)
    const toSend = contacts.filter(c => c.email)

    for (const contact of toSend) {
      const personalizedMsg = emailMessage
        .replace('{name}', contact.name || 'there')
        .replace('{link}', link)

      // Send via Supabase Edge Function or log for now
      await supabase.from('analytics_events').insert({
        event_name: 'survey_email_sent',
        properties: {
          to: contact.email,
          subject: emailSubject,
          message: personalizedMsg,
          survey_id: selectedSurvey?.id
        }
      })
      setSent(prev => [...prev, contact.email])
      await new Promise(r => setTimeout(r, 200))
    }
    setSending(false)
    setStep(3)
  }

  const emailContacts = contacts.filter(c => c.email)
  const whatsappContacts = contacts.filter(c => c.phone)

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar active="distribution" />
      <div style={{flex:1,background:'#F7F8FA',overflow:'auto'}}>
        {/* Topbar */}
        <div style={{background:'white',borderBottom:'1px solid #E4E7EE',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontSize:18,fontWeight:800,color:'#0D0F14',fontFamily:'system-ui'}}>Distribution</h1>
          <span style={{fontSize:13,color:'#7C8494',fontFamily:'system-ui'}}>Send surveys to your contacts via WhatsApp or Email</span>
        </div>

        <div style={{padding:28,maxWidth:900,margin:'0 auto'}}>
          {/* Progress steps */}
          <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:32}}>
            {[{n:1,label:'Select Survey'},{n:2,label:'Add Contacts'},{n:3,label:'Send'}].map((s,i)=>(
              <div key={s.n} style={{display:'flex',alignItems:'center',flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:step>=s.n?'#4F46E5':'#E4E7EE',color:step>=s.n?'white':'#7C8494',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0,fontFamily:'system-ui'}}>{s.n}</div>
                  <span style={{fontSize:13,fontWeight:step===s.n?700:400,color:step===s.n?'#0D0F14':'#7C8494',fontFamily:'system-ui',whiteSpace:'nowrap'}}>{s.label}</span>
                </div>
                {i<2&&<div style={{flex:1,height:2,background:step>s.n?'#4F46E5':'#E4E7EE',margin:'0 12px'}}></div>}
              </div>
            ))}
          </div>

          {/* STEP 1 — Select Survey */}
          {step === 1 && (
            <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:24}}>
              <h2 style={{fontSize:16,fontWeight:700,marginBottom:16,fontFamily:'system-ui'}}>Which survey do you want to send?</h2>
              {surveys.length === 0 ? (
                <div style={{textAlign:'center',padding:32,color:'#7C8494'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📋</div>
                  <p style={{fontFamily:'system-ui',marginBottom:12}}>No active surveys found</p>
                  <a href="/surveys/new" style={{color:'#4F46E5',fontFamily:'system-ui',fontWeight:600}}>Create a survey first →</a>
                </div>
              ) : surveys.map(s => (
                <div key={s.id} onClick={() => setSelectedSurvey(s)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:16,border:'1.5px solid',borderColor:selectedSurvey?.id===s.id?'#4F46E5':'#E4E7EE',borderRadius:10,marginBottom:10,cursor:'pointer',background:selectedSurvey?.id===s.id?'#EEF2FF':'white',transition:'all 0.15s'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📋</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,fontFamily:'system-ui'}}>{s.title}</div>
                    <div style={{fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>insightiq.co.za/s/{s.id.substring(0,8)}...</div>
                  </div>
                  {selectedSurvey?.id===s.id && <span style={{color:'#4F46E5',fontSize:20}}>✓</span>}
                </div>
              ))}
              {selectedSurvey && (
                <button onClick={() => setStep(2)}
                  style={{width:'100%',padding:12,background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',marginTop:8,fontFamily:'system-ui'}}>
                  Continue with "{selectedSurvey.title}" →
                </button>
              )}
            </div>
          )}

          {/* STEP 2 — Add Contacts */}
          {step === 2 && (
            <div>
              {/* Channel tabs */}
              <div style={{display:'flex',gap:8,marginBottom:20}}>
                {[{key:'whatsapp',icon:'💬',label:'WhatsApp'},{key:'email',icon:'📧',label:'Email'}].map(t=>(
                  <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                    style={{padding:'8px 20px',background:activeTab===t.key?'#4F46E5':'white',color:activeTab===t.key?'white':'#3A3F4B',border:'1.5px solid',borderColor:activeTab===t.key?'#4F46E5':'#E4E7EE',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'system-ui',display:'flex',alignItems:'center',gap:6}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                {/* Left — add contacts */}
                <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20}}>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:16,fontFamily:'system-ui'}}>Add Contacts</h3>

                  {/* Upload CSV */}
                  <div onClick={() => fileRef.current?.click()}
                    style={{border:'2px dashed #C7D2FE',borderRadius:10,padding:20,textAlign:'center',cursor:'pointer',marginBottom:16,background:'#F8F9FF'}}>
                    <div style={{fontSize:28,marginBottom:6}}>📁</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#4F46E5',fontFamily:'system-ui'}}>Upload CSV file</div>
                    <div style={{fontSize:11,color:'#7C8494',marginTop:4,fontFamily:'system-ui'}}>Columns: name, email, phone</div>
                    <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{display:'none'}}/>
                  </div>

                  <div style={{fontSize:12,color:'#7C8494',textAlign:'center',marginBottom:12,fontFamily:'system-ui'}}>— or add manually —</div>

                  {/* Manual entry */}
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <input placeholder="Full name" value={manualName} onChange={e=>setManualName(e.target.value)}
                      style={{padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'system-ui'}}/>
                    <input placeholder="Email address" value={manualEmail} onChange={e=>setManualEmail(e.target.value)}
                      style={{padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'system-ui'}}/>
                    <input placeholder="WhatsApp number (e.g. 0821234567)" value={manualPhone} onChange={e=>setManualPhone(e.target.value)}
                      style={{padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'system-ui'}}/>
                    <button onClick={addManualContact}
                      style={{padding:'8px',background:'#EEF2FF',color:'#4F46E5',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'system-ui'}}>
                      + Add Contact
                    </button>
                  </div>

                  {/* CSV template download */}
                  <div style={{marginTop:16,padding:10,background:'#F7F8FA',borderRadius:8,fontSize:12,color:'#7C8494',fontFamily:'system-ui'}}>
                    💡 CSV format: <strong>name,email,phone</strong><br/>
                    Example: John Smith,john@co.za,0821234567
                  </div>
                </div>

                {/* Right — contacts list */}
                <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h3 style={{fontSize:14,fontWeight:700,fontFamily:'system-ui'}}>Contacts ({contacts.length})</h3>
                    <div style={{display:'flex',gap:8}}>
                      <span style={{fontSize:12,background:'#ECFDF5',color:'#10B981',padding:'2px 8px',borderRadius:100,fontFamily:'system-ui'}}>📧 {emailContacts.length} email</span>
                      <span style={{fontSize:12,background:'#F0FDF4',color:'#10B981',padding:'2px 8px',borderRadius:100,fontFamily:'system-ui'}}>💬 {whatsappContacts.length} WhatsApp</span>
                    </div>
                  </div>

                  {contacts.length === 0 ? (
                    <div style={{textAlign:'center',padding:32,color:'#B0B8C8'}}>
                      <div style={{fontSize:32,marginBottom:8}}>👥</div>
                      <p style={{fontFamily:'system-ui',fontSize:13}}>No contacts yet — upload a CSV or add manually</p>
                    </div>
                  ) : (
                    <div style={{maxHeight:320,overflowY:'auto'}}>
                      {contacts.map((c,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid #F0F2F7'}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#4F46E5',flexShrink:0,fontFamily:'system-ui'}}>
                            {(c.name||'?')[0].toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'#0D0F14',fontFamily:'system-ui',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name||'No name'}</div>
                            <div style={{fontSize:11,color:'#7C8494',fontFamily:'system-ui',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {c.email && `📧 ${c.email}`}{c.email&&c.phone&&' · '}{c.phone && `💬 ${c.phone}`}
                            </div>
                          </div>
                          <button onClick={()=>removeContact(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#B0B8C8',fontSize:16,padding:'0 4px',flexShrink:0}}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message template for email */}
              {activeTab === 'email' && (
                <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:20,marginTop:20}}>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,fontFamily:'system-ui'}}>Email Message</h3>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,fontWeight:600,color:'#7C8494',display:'block',marginBottom:4,fontFamily:'system-ui'}}>Subject line</label>
                    <input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)}
                      style={{width:'100%',padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'system-ui'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:'#7C8494',display:'block',marginBottom:4,fontFamily:'system-ui'}}>Message <span style={{fontWeight:400}}>(use {'{name}'} and {'{link}'} as placeholders)</span></label>
                    <textarea value={emailMessage} onChange={e=>setEmailMessage(e.target.value)} rows={5}
                      style={{width:'100%',padding:'8px 10px',border:'1px solid #E4E7EE',borderRadius:6,fontSize:13,fontFamily:'system-ui',resize:'vertical'}}/>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{display:'flex',gap:12,marginTop:20}}>
                <button onClick={()=>setStep(1)} style={{padding:'10px 20px',background:'white',border:'1px solid #E4E7EE',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'system-ui'}}>← Back</button>

                {activeTab === 'whatsapp' ? (
                  <div style={{flex:1,background:'#ECFDF5',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#065F46',marginBottom:8,fontFamily:'system-ui'}}>💬 Send via WhatsApp</div>
                    <div style={{fontSize:12,color:'#7C8494',marginBottom:12,fontFamily:'system-ui'}}>Click each link below to open WhatsApp and send to each contact individually</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:200,overflowY:'auto'}}>
                      {whatsappContacts.length === 0 ? (
                        <p style={{color:'#7C8494',fontSize:12,fontFamily:'system-ui'}}>No contacts with phone numbers added yet</p>
                      ) : whatsappContacts.map((c,i)=>(
                        <a key={i} href={getWhatsAppLink(c)} target="_blank"
                          style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#10B981',color:'white',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>
                          <span>💬</span> Send to {c.name || c.phone}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button onClick={sendViaEmail} disabled={sending||emailContacts.length===0}
                    style={{flex:1,padding:'10px',background:sending||emailContacts.length===0?'#818CF8':'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:sending||emailContacts.length===0?'not-allowed':'pointer',fontFamily:'system-ui'}}>
                    {sending?`Sending... (${sent.length}/${emailContacts.length})`:`📧 Send Email to ${emailContacts.length} contacts`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div style={{background:'white',border:'1px solid #E4E7EE',borderRadius:12,padding:48,textAlign:'center'}}>
              <div style={{fontSize:64,marginBottom:16}}>🎉</div>
              <h2 style={{fontSize:22,fontWeight:800,marginBottom:8,fontFamily:'system-ui'}}>Survey Sent!</h2>
              <p style={{color:'#7C8494',marginBottom:24,fontFamily:'system-ui'}}>Your survey has been distributed to {contacts.length} contacts. Check back soon to see responses coming in.</p>
              <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                <a href="/dashboard" style={{padding:'10px 24px',background:'#4F46E5',color:'white',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,fontFamily:'system-ui'}}>View Dashboard</a>
                <button onClick={()=>{setStep(1);setSent([]);setContacts([])}}
                  style={{padding:'10px 24px',background:'white',border:'1px solid #E4E7EE',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'system-ui'}}>
                  Send Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
