# Aura — MVP Chat IA avec Paywall intelligent

## Structure du projet

```
mvp-chat/
├── public/
│   └── index.html          ← Interface chat complète
├── api/
│   ├── chat.js             ← Appel Grok API + logique paywall
│   └── create-checkout.js  ← Création session Stripe
├── vercel.json             ← Config Vercel
├── package.json
└── README.md
```

## Déploiement en 10 minutes

### 1. Prérequis
- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [xAI / Grok](https://console.x.ai) → récupérer une API key
- Compte [Stripe](https://stripe.com) → récupérer les clés API

### 2. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Dans le dossier du projet
vercel

# Suivre les instructions (projet détecté automatiquement)
```

### 3. Variables d'environnement (dans Vercel Dashboard)

Aller dans **Project Settings → Environment Variables** et ajouter :

| Variable | Description |
|---|---|
| `GROK_API_KEY` | Votre clé API xAI (commence par `xai-...`) |
| `STRIPE_SECRET_KEY` | Votre clé secrète Stripe (`sk_live_...` ou `sk_test_...`) |

### 4. Tester en local

```bash
npm install
vercel dev
```

Accéder à `http://localhost:3000`

---

## Comment fonctionne le paywall intelligent

L'IA (Grok) décide elle-même quand déclencher le paywall via un token caché `[TRIGGER_PAYWALL]`.

Le système prompt lui donne ces critères :
- L'utilisateur exprime un besoin récurrent
- La conversation atteint un moment émotionnel fort
- L'utilisateur est visiblement satisfait et engagé
- Il reste 1 message gratuit ou moins (sécurité)

Le token est retiré du message affiché — l'utilisateur voit une réponse normale, puis la modale de paiement apparaît 800ms après.

---

## Personnalisation rapide

**Changer le prix** → `api/create-checkout.js` ligne `unit_amount: 900` (en centimes)

**Changer la limite gratuite** → `public/index.html` ligne `const FREE_LIMIT = 3`

**Changer le nom/branding** → Chercher "Aura" dans `index.html`

**Modifier le comportement de l'IA** → `api/chat.js` dans `systemPrompt`

---

## Coût mensuel estimé

| Service | Coût |
|---|---|
| Vercel | 0€/mois (plan gratuit) |
| Grok API | ~0.002€/message (pay-as-you-go) |
| Stripe | 0€ + 2.9% par transaction |
| **Total fixe** | **0€/mois** |
