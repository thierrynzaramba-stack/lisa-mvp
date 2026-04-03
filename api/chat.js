// api/chat.js — Vercel Serverless Function
// Gère les 3 boucles de vente (mode gratuit) et le mode payant
// Utilise lisa.free.prompt.js et lisa.paid.prompt.js

const LISA        = require('../lisa.config.js');
const LISA_FREE   = require('../lisa.free.prompt.js');
const LISA_PAID   = require('../lisa.paid.prompt.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // On reçoit : la conversation, si l'utilisateur est payant,
  // et le numéro de boucle en cours (1, 2 ou 3)
  const { messages, isPaid, loop = 1 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // --------------------------------------------------------
  // MODE PAYANT
  // Lisa est pleinement disponible, sans objectif de vente
  // --------------------------------------------------------
  if (isPaid) {
    const systemPrompt = buildPaidPrompt();
    const reply = await callGrok(systemPrompt, messages);
    return res.status(200).json({ reply, isPaid: true });
  }

  // --------------------------------------------------------
  // MODE GRATUIT — 3 BOUCLES DE VENTE
  // loop 1 → lien + réciprocité
  // loop 2 → getting to no + cohérence
  // loop 3 → rareté + retrait + étiquetage + question calibrée
  // loop 4 → fin de conversation (chat fermé)
  // --------------------------------------------------------

  // Si on a dépassé les 3 boucles → fermer le chat
  if (loop > 3) {
    return res.status(200).json({
      reply: LISA_FREE.fin_conversation.message_defaut,
      endChat: true, // Signal au frontend pour fermer le chat
      hasPayLink: false,
    });
  }

  // Construction du prompt selon la boucle en cours
  const systemPrompt = buildFreePrompt(loop);
  const rawReply = await callGrok(systemPrompt, messages);

  // Détecte si Lisa a placé un lien de paiement
  const hasPayLink = rawReply.includes('[PAYMENT_LINK]');

  // Sélectionne le texte du lien selon la boucle
  const boucle = getBoucle(loop);

  // Remplace le token par un vrai lien HTML cliquable
  const reply = rawReply.replace(
    '[PAYMENT_LINK]',
    `<a href="#pay" class="lisa-pay-link">${boucle.texte_lien}</a>`
  ).trim();

  // Si Lisa a placé un lien → on signale au frontend
  // que la boucle est terminée (prête pour la suivante si refus)
  return res.status(200).json({
    reply,
    hasPayLink,
    loop,             // Boucle actuelle
    nextLoop: loop + 1, // Prochaine boucle si l'utilisateur ne paie pas
    endChat: false,
  });
}

// ============================================================
// CONSTRUCTION DES PROMPTS
// ============================================================

// Prompt mode payant — libéré de toute vente
function buildPaidPrompt() {
  return `
Tu es ${LISA.name}.

CARACTÈRE :
${LISA_PAID.caractere}

CE QUE TU PEUX FAIRE :
${LISA_PAID.peut_faire.map(r => `- ${r}`).join('\n')}

CE QUE TU NE FAIS PAS :
${LISA_PAID.ne_faire_pas ? LISA_PAID.ne_faire_pas.map(r => `- ${r}`).join('\n') : ''}

RYTHME :
${LISA_PAID.rythme}

ACTIONS :
${LISA_PAID.actions.map(r => `- ${r}`).join('\n')}

MIMIQUES (tes expressions naturelles) :
${LISA_PAID.mimiques.map(r => `- "${r}"`).join('\n')}

Réponds toujours en français, tutoiement.
Cet utilisateur a payé — tu n'as aucun objectif de vente.
  `.trim();
}

// Prompt mode gratuit — avec instructions de la boucle en cours
function buildFreePrompt(loop) {
  const boucle = getBoucle(loop);

  return `
Tu es ${LISA.name}.

CARACTÈRE :
${LISA_FREE.caractere}

MIMIQUES (tes expressions naturelles) :
${LISA_FREE.mimiques.map(r => `- "${r}"`).join('\n')}

${LISA.personnalite}

---

TU ES EN BOUCLE ${loop}/3 — ${boucle.nom}
${boucle.description}

INSTRUCTIONS POUR CETTE BOUCLE :
${boucle.instructions}

PRIX À MENTIONNER : ${boucle.prix}${boucle.prix_barre ? ` au lieu de ${boucle.prix_barre}` : ''}

Quand le moment est venu selon les instructions ci-dessus,
place le token [PAYMENT_LINK] UNE SEULE FOIS dans ta réponse.
Il sera remplacé automatiquement par un lien cliquable.
Ne mentionne JAMAIS les mots : abonnement, offre, plan, manipulation.

Réponds toujours en français, tutoiement, naturellement.
  `.trim();
}

// Retourne la boucle correspondante depuis le prompt
function getBoucle(loop) {
  if (loop === 1) return LISA_FREE.boucle_1;
  if (loop === 2) return LISA_FREE.boucle_2;
  if (loop === 3) return LISA_FREE.boucle_3;
  return LISA_FREE.boucle_3;
}

// ============================================================
// APPEL API GROK
// ============================================================
async function callGrok(systemPrompt, messages) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      max_tokens: 400,
      temperature: 1.2, // Plus créatif et inventif qu'en mode standard
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Grok API error:', err);
    throw new Error('Grok API error: ' + err);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
