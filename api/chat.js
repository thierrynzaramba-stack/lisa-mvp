// api/chat.js — Vercel Serverless Function
// Lisa décide seule quand déclencher le paiement — pas de limite de messages

const LISA = require('../lisa.config.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, isPaid } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const systemPrompt = `
Tu es ${LISA.name}.

PERSONNALITÉ :
${LISA.personnalite}

CE QUE TU PEUX FAIRE :
${LISA.peut_faire.map(r => `- ${r}`).join('\n')}

CE QUE TU NE FAIS PAS :
${LISA.ne_fait_pas.map(r => `- ${r}`).join('\n')}

EXEMPLES DE TON STYLE :
${LISA.exemples_reponses.map(r => `- "${r}"`).join('\n')}

---

${isPaid
  ? "Cet utilisateur a un accès complet. Ignore tout ce qui concerne le paiement."
  : `DÉCLENCHEMENT DU PAIEMENT :
${LISA.declenchement_paiement}

Quand le moment est venu, intègre NATURELLEMENT le token [PAYMENT_LINK] dans ta réponse.
Ce token sera remplacé par un vrai lien cliquable.
Place-le une seule fois, à la fin de ta réponse, dans une phrase naturelle.

Exemple :
"Ce que tu vis mérite d'être exploré jusqu'au bout. [PAYMENT_LINK]"

Ne mentionne jamais les mots : abonnement, offre, paiement, plan, accès payant.
`}

Réponds toujours en français, tutoiement, 1-3 phrases maximum.
`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        max_tokens: 300,
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

    const hasPayLink = rawReply.includes('[PAYMENT_LINK]');

    // Remplace le token par un lien HTML cliquable
    const reply = rawReply.replace(
      '[PAYMENT_LINK]',
      `<a href="#pay" class="lisa-pay-link">${LISA.texte_lien_paiement}</a>`
    ).trim();

    return res.status(200).json({ reply, hasPayLink });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
