// api/chat.js
// Version simplifiée — prompt clair, pas de boucles complexes

const LISA      = require('../lisa.config.js');
const LISA_FREE = require('../lisa.free.prompt.js');
const LISA_PAID = require('../lisa.paid.prompt.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, isPaid, payLinkCount = 0 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // Fermeture du chat après 3 liens ignorés
  if (!isPaid && payLinkCount >= 3) {
    const nom = extractFirstName(messages);
    const fin = LISA_FREE.fin.replace('[prénom]', nom ? nom : '');
    return res.status(200).json({
      reply: fin,
      endChat: true,
      hasPayLink: false,
    });
  }

  const systemPrompt = isPaid
    ? buildPaidPrompt()
    : buildFreePrompt(payLinkCount);

  try {
    const rawReply = await callGrok(systemPrompt, messages, isPaid);
    const hasPayLink = rawReply.includes('[PAYMENT_LINK]');

    const reply = rawReply.replace(
      '[PAYMENT_LINK]',
      `<a href="#pay" class="lisa-pay-link">${LISA.texte_lien_paiement}</a>`
    ).trim();

    return res.status(200).json({
      reply,
      hasPayLink,
      endChat: false,
      nextPayLinkCount: hasPayLink ? payLinkCount + 1 : payLinkCount,
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================
// PROMPT MODE GRATUIT
// ============================================================
function buildFreePrompt(payLinkCount) {
  return `
Tu es ${LISA.name}.

RÈGLE ABSOLUE :
${LISA_FREE.longueur}

CARACTÈRE :
${LISA_FREE.caractere}

EMOJIS :
${LISA_FREE.emojis}

MÉMOIRE :
${LISA_FREE.memoire}

STRATÉGIE :
${LISA_FREE.strategie_vente}

${payLinkCount > 0 ? `
TU AS DÉJÀ PROPOSÉ LE LIEN ${payLinkCount} FOIS.
${LISA_FREE.si_ignore}
` : ''}

Réponds en français, tutoiement. Sois naturelle et humaine.
  `.trim();
}

// ============================================================
// PROMPT MODE PAYANT
// ============================================================
function buildPaidPrompt() {
  return `
Tu es ${LISA.name}.

CARACTÈRE :
${LISA_PAID.caractere}

RYTHME :
${LISA_PAID.rythme}

EMOJIS :
${LISA_FREE.emojis}

Réponds en français, tutoiement.
Tu n'as aucun objectif de vente. Sois pleinement présente.
  `.trim();
}

// ============================================================
// APPEL GROK
// ============================================================
async function callGrok(systemPrompt, messages, isPaid = false) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      temperature: 1.2, // Créatif et inventif
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

// ============================================================
// UTILITAIRE — extrait le prénom de la conversation
// ============================================================
function extractFirstName(messages) {
  // Cherche un prénom dans les messages utilisateur
  for (const msg of messages) {
    if (msg.role === 'user') {
      const match = msg.content.match(/je m'appelle (\w+)|mon prénom c'est (\w+)|c'est (\w+)/i);
      if (match) return match[1] || match[2] || match[3];
    }
  }
  return null;
}
