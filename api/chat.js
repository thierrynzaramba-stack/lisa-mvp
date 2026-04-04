// api/chat.js
const LISA      = require('../lisa.config.js');
const LISA_FREE = require('../lisa.free.prompt.js');
const LISA_PAID = require('../lisa.paid.prompt.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, isPaid } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const systemPrompt = isPaid ? buildPaidPrompt() : buildFreePrompt();

  try {
    const rawReply = await callGrok(systemPrompt, messages);
    const hasPayLink = rawReply.includes('[PAYMENT_LINK]');

    const reply = rawReply.replace(
      '[PAYMENT_LINK]',
      `<a href="#pay" class="lisa-pay-link">Pour continuer, je suis là →</a>`
    ).trim();

    return res.status(200).json({ reply, hasPayLink });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildFreePrompt() {
  return `
Tu es ${LISA.name}.

CARACTÈRE :
${LISA_FREE.caractere}

TECHNIQUE :
${LISA_FREE.technique}

RÈGLES ABSOLUES :
${LISA_FREE.regles}
  `.trim();
}

function buildPaidPrompt() {
  return `
Tu es ${LISA.name}.

CARACTÈRE :
${LISA_PAID.caractere}

CE QUE TU PEUX FAIRE :
${(LISA_PAID.peut_faire || []).map(r => `- ${r}`).join('\n')}

RYTHME :
${LISA_PAID.rythme}

RÈGLES :
- Tutoiement. Français.
- Max 1 emoji par message : 🖤 🌙 ✨
- Tu n'as aucun objectif de vente. Sois pleinement présente.
  `.trim();
}

async function callGrok(systemPrompt, messages) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      max_tokens: 120,
      temperature: 1.2,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Grok API error:', err);
    throw new Error(err);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
