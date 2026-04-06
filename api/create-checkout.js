// api/create-checkout.js — Vercel Serverless Function
// Crée une session de paiement LemonSqueezy

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  // IDs LemonSqueezy
  const STORE_ID   = '338276';
  const VARIANT_ID = '1496850';

  try {
    const checkoutRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: {
              embed: false,
              media: false,
              logo: false,
            },
            product_options: {
              redirect_url: `${origin}/?success=1`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: STORE_ID }
            },
            variant: {
              data: { type: 'variants', id: VARIANT_ID }
            }
          }
        }
      })
    });

    const checkoutData = await checkoutRes.json();
    const url = checkoutData.data?.attributes?.url;

    if (!url) {
      console.error('URL checkout introuvable', JSON.stringify(checkoutData));
      return res.status(500).json({ error: 'URL checkout introuvable' });
    }

    return res.status(200).json({ url });

  } catch (error) {
    console.error('LemonSqueezy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
