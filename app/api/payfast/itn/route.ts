import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData) as Record<string, string>

    // 1. Verify PayFast signature
    const passphrase = process.env.PAYFAST_PASSPHRASE!
    const { signature, ...rest } = data
    const paramString = Object.entries(rest)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
      .join('&')

    const expectedSig = crypto
      .createHash('md5')
      .update(paramString + '&passphrase=' + encodeURIComponent(passphrase))
      .digest('hex')

    if (expectedSig !== signature) {
      console.error('PayFast ITN: Invalid signature')
      return new Response('Invalid signature', { status: 400 })
    }

    // 2. Only process COMPLETE payments
    if (data.payment_status !== 'COMPLETE') {
      return new Response('OK - not complete', { status: 200 })
    }

    const supabase = createAdminClient()
    const email = data.custom_str3
    const plan  = data.custom_str1  // starter | professional

    // 3. Find the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      console.error('PayFast ITN: User not found for email', email)
      return new Response('User not found', { status: 200 }) // Return 200 so PayFast doesn't retry
    }

    // 4. Upgrade their plan
    await supabase
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    // 5. Create subscription record
    const amount_cents = plan === 'professional' ? 99900 : 29900
    await supabase.from('subscriptions').upsert({
      user_id: profile.id,
      plan,
      status: 'active',
      amount_cents,
      payfast_payment_id: data.pf_payment_id,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'payfast_payment_id' })

    // 6. Log the payment
    await supabase.from('payments').insert({
      user_id: profile.id,
      payfast_payment_id: data.pf_payment_id,
      m_payment_id: data.m_payment_id,
      amount: parseFloat(data.amount_gross),
      item_name: data.item_name,
      payment_status: 'COMPLETE',
      itn_raw: data,
    })

    // 7. Track the event
    await supabase.from('analytics_events').insert({
      user_id: profile.id,
      event_name: 'payfast_payment_success',
      properties: { plan, amount: data.amount_gross, payment_id: data.pf_payment_id }
    })

    console.log(`PayFast ITN: Upgraded ${email} to ${plan}`)
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('PayFast ITN error:', err)
    return new Response('Server error', { status: 500 })
  }
}
