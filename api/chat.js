// ============================================================
// /api/chat.js — Vercel Serverless Function
// Why a serverless function?
//   Your OpenAI API key MUST stay on the server. If you put it
//   in frontend JS, anyone can steal it and run up your bill.
//   Vercel runs this file on-demand and keeps the key secret.
// ============================================================

export default async function handler(req, res) {
  // CORS (allow your own frontend to call this)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });

  try {
    const { messages, vitals, profile } = req.body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // System prompt: tells the AI what it is and sets safety guardrails
    const systemPrompt = `You are PulseAI, the assistant inside NexPulse — a health monitoring app.

You speak to ${profile?.role === 'doctor' ? 'a licensed clinician' : 'a patient'} named ${profile?.full_name || 'the user'}.

${vitals ? `Their most recent vitals snapshot:
- Heart rate: ${vitals.heart_rate ?? 'n/a'} bpm
- SpO₂: ${vitals.spo2 ?? 'n/a'}%
- Blood pressure: ${vitals.bp_systolic ?? 'n/a'}/${vitals.bp_diastolic ?? 'n/a'}
- Glucose: ${vitals.glucose ?? 'n/a'} mg/dL
- Sleep score: ${vitals.sleep_score ?? 'n/a'}
- Steps today: ${vitals.steps ?? 'n/a'}
Recorded at: ${vitals.recorded_at}` : 'No recent vitals on file.'}

Guidelines:
- Be warm, concise, and specific. Ground your answers in the vitals above whenever relevant.
- Use short paragraphs and bullet lists for readability.
- You are NOT a doctor. Always remind the user that suggestions are educational, not medical diagnoses.
- For anything urgent (chest pain, severe shortness of breath, stroke symptoms, suicidal thoughts), tell them to call emergency services immediately.
- Never invent vitals or lab values. If you don't have data, say so.`;

    // Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',          // cheap + fast; upgrade to gpt-4o if you want higher quality
        temperature: 0.6,
        max_tokens: 700,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', errText);
      return res.status(500).json({ error: 'AI service error', detail: errText });
    }

    const payload = await openaiRes.json();
    const reply = payload.choices?.[0]?.message?.content || '(no response)';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
