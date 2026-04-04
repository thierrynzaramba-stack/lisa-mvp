// api/create-checkout.js — Vercel Serverless Function
// Crée une session Stripe Checkout

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Accès portail web 24H',
              description: 'Accès complet au service pendant 24 heures.',
            },
            unit_amount: 399, // 3,99 €
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?success=1`,
      cancel_url: `${origin}/?cancelled=1`,
      locale: 'fr',
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
}
