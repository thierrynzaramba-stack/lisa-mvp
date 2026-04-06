// api/create-checkout.js — Vercel Serverless Function
// Crée une session de paiement LemonSqueezy

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  try {
    // Étape 1 — Récupère le Variant ID du produit
    const productRes = await fetch('https://api.lemonsqueezy.com/v1/variants?filter[product_id]=952725', {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
      }
    });

    const productData = await productRes.json();
    const variantId = productData.data?.[0]?.id;

    if (!variantId) {
      console.error('Variant ID introuvable', productData);
      return res.status(500).json({ error: 'Variant ID introuvable' });
    }

    // Étape 2 — Crée le checkout
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
            checkout_data: {
              custom: {
                source: 'lisa-web'
              }
            },
            product_options: {
              redirect_url: `${origin}/?success=1`,
            },
            expires_at: null,
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: process.env.LEMONSQUEEZY_STORE_ID,
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              }
            }
          }
        }
      })
    });

    const checkoutData = await checkoutRes.json();
    const url = checkoutData.data?.attributes?.url;

    if (!url) {
      console.error('URL checkout introuvable', checkoutData);
      return res.status(500).json({ error: 'URL checkout introuvable' });
    }

    return res.status(200).json({ url });

  } catch (error) {
    console.error('LemonSqueezy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
