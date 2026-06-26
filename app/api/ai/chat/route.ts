import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorised', { status: 401 })

  const { messages, surveyId, type } = await request.json()

  // Build context from real survey data
  let surveyContext = ''
  if (surveyId) {
    const [{ data: survey }, { data: responses }] = await Promise.all([
      supabase.from('surveys').select('*').eq('id', surveyId).single(),
      supabase.from('responses').select('*').eq('survey_id', surveyId).limit(200),
    ])
    if (survey) {
      surveyContext = `
Survey: "${survey.title}"
Total responses: ${responses?.length ?? 0}
Questions: ${JSON.stringify(survey.questions?.slice(0, 5))}
Sample answers: ${JSON.stringify(responses?.slice(0, 10).map(r => r.answers))}
Sentiment breakdown: Positive: ${responses?.filter(r => r.sentiment === 'positive').length}, Neutral: ${responses?.filter(r => r.sentiment === 'neutral').length}, Negative: ${responses?.filter(r => r.sentiment === 'negative').length}
NPS scores: ${responses?.filter(r => r.nps_score !== null).map(r => r.nps_score).join(', ')}
`
    }
  }

  const systemPrompt = `You are InsightIQ, an expert business analytics assistant for a South African survey platform.
${surveyContext}
Provide concise, actionable insights in plain English. Use bold for key numbers. Keep responses under 200 words unless asked for more. Be direct and confident — this is for an executive audience.`

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: true,
  })

  // Stream the response
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
