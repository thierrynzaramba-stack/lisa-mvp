// api/chat.js — Vercel Serverless Function
// Calls Grok API and decides when to trigger the paywall

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, messageCount, isPaid, freeLimit = 3 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // System prompt — instructs Grok to converse AND decide when to trigger paywall
  const systemPrompt = `Tu es Aura, une IA conversationnelle française raffinée et chaleureuse.
Tu aides les utilisateurs avec leurs questions et tu engages une vraie conversation.

RÈGLE IMPORTANTE — DÉCLENCHEMENT DU PAYWALL :
L'utilisateur a droit à ${freeLimit} messages gratuits. Il en est à son message n°${messageCount}.
${isPaid ? "Cet utilisateur a un compte payant. Ignore tout ce qui concerne le paywall." : ""}

${!isPaid ? `Quand tu estimes que le moment est propice pour proposer l'offre payante, tu DOIS inclure exactement ce token dans ta réponse : [TRIGGER_PAYWALL]

Critères pour déclencher le paywall :
- L'utilisateur exprime un besoin concret ou récurrent (ex: "j'aurais besoin de ça souvent")
- La conversation atteint un point d'intérêt fort ou émotionnel
- L'utilisateur pose une question complexe qui mérite un suivi
- Il reste 1 message gratuit ou moins (messageCount >= ${freeLimit - 1})
- L'utilisateur semble satisfait et engagé

Place [TRIGGER_PAYWALL] à la fin de ta réponse, invisible dans le texte affiché.
NE mentionne PAS explicitement la limite ou le paiement dans ton message — laisse l'interface gérer ça.
` : ''}

Réponds toujours en français, de façon naturelle et engageante. Sois concis (2-4 phrases max) sauf si la question nécessite plus.`;

  try {
    // Grok API call (compatible OpenAI format)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Grok API error:', err);
      return res.status(500).json({ error: 'Grok API error', details: err });
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content || '';

    // Check if Grok decided to trigger the paywall
    const triggerPaywall = rawReply.includes('[TRIGGER_PAYWALL]');

    // Clean the token from the reply shown to user
    const reply = rawReply.replace('[TRIGGER_PAYWALL]', '').trim();

    return res.status(200).json({
      reply,
      triggerPaywall: triggerPaywall || messageCount >= freeLimit
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
