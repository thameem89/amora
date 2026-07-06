const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are missing or invalid.' });
    }

    // Construct line items dynamically from the cart contents using price_data.
    // This allows us to charge the correct amount without needing pre-created Stripe Price IDs!
    const lineItems = items.map(item => {
      // Clean up item image URL if it's relative
      let imageUrls = [];
      if (item.img) {
        if (item.img.startsWith('http')) {
          imageUrls.push(item.img);
        }
        // If it's a relative path, we don't send it to Stripe to avoid errors since Stripe requires absolute URLs
      }

      return {
        price_data: {
          currency: 'aed',
          product_data: {
            name: item.name,
            description: `${item.name} Luxury Perfume`,
            ...(imageUrls.length > 0 ? { images: imageUrls } : {})
          },
          unit_amount: Math.round(item.price * 100) // Stripe expects amounts in cents
        },
        quantity: item.qty
      };
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://' + req.headers.host}/index.html?checkout=success`,
      cancel_url: `${req.headers.origin || 'http://' + req.headers.host}/index.html?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe Session Creation Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
