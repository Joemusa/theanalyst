import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const text = await request.text()
    console.log('PayFast ITN received:', text)

    const params = new URLSearchParams(text)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    console.log('PayFast data:', JSON.stringify(data))

    // Only process COMPLETE payments
    if (data.payment_status !== 'COMPLETE') {
      console.log('Payment not complete:', data.payment_status)
      return new Response('OK', { status: 200 })
    }

    const email = data.custom_str3
    const plan = data.custom_str1

    if (!email || !plan) {
      console.log('Missing email or plan:', email, plan)
      return new Response('OK', { status: 200 })
    }

    const supabase = await createAdminClient()

    // Find user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.log('User not found:', email, profileError)
      return new Response('OK', { status: 200 })
    }

    // Upgrade plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (updateError) {
      console.log('Update error:', updateError)
      return new Response('OK', { status: 200 })
    }

    // Log payment
    await supabase.from('payments').insert({
      user_id: profile.id,
      payfast_payment_id: data.pf_payment_id ?? '',
      m_payment_id: data.m_payment_id ?? '',
      amount: parseFloat(data.amount_gross ?? '0'),
      item_name: data.item_name ?? '',
      payment_status: 'COMPLETE',
      itn_raw: data,
    })

    // Create subscription
    await supabase.from('subscriptions').insert({
      user_id: profile.id,
      plan,
      status: 'active',
      amount_cents: plan === 'professional' ? 99900 : 29900,
      payfast_payment_id: data.pf_payment_id ?? '',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    console.log(`Successfully upgraded ${email} to ${plan}`)
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('ITN error:', err)
    return new Response('OK', { status: 200 })
  }
}
