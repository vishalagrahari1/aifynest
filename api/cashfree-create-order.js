/* api/cashfree-create-order.js - Vercel Serverless Function */

export default async function handler(req, res) {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { order_id, order_amount, order_currency, customer_details, order_meta } = req.body || {};

  const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
  const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
  const CASHFREE_ENV = (process.env.VITE_CASHFREE_ENV || 'production').toLowerCase();

  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    console.error('Missing Cashfree credentials on server');
    return res.status(500).json({ message: 'Server configuration error: Missing Cashfree API credentials' });
  }

  const CASHFREE_BASE_URL = CASHFREE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

  try {
    const payload = {
      order_id: order_id || `cf_ord_${Math.random().toString(36).substring(2, 10)}`,
      order_amount: Number(order_amount || 69),
      order_currency: order_currency || 'USD',
      customer_details: {
        customer_id: (customer_details?.customer_email || 'guest').replace(/[^a-zA-Z0-9]/g, '_'),
        customer_name: customer_details?.customer_name || 'Tool Owner',
        customer_email: customer_details?.customer_email || 'contact@aifynest.com',
        customer_phone: customer_details?.customer_phone || '9999999999',
      },
      order_meta: order_meta || {
        return_url: `https://aifynest.com/pricing`,
      },
    };

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.payment_session_id) {
      return res.status(200).json({
        success: true,
        payment_session_id: data.payment_session_id,
        order_id: data.order_id,
      });
    } else {
      console.error('Cashfree order endpoint error response:', data);
      return res.status(400).json({ 
        success: false, 
        message: data.message || 'Cashfree API rejected order creation',
        details: data 
      });
    }
  } catch (error) {
    console.error('Cashfree API server exception:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
