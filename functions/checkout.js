export async function onRequestPost(context) {
  const body = await context.request.json();
  const { userId, email, product_id, request_id, metadata, success_url } = body;
  const CREEM_API_KEY = context.env.CREEM_API_KEY;

  // Use a default product_id if not provided
  const PRODUCT_ID = product_id || 'prod_3Fti6u4wp141TAXBwlAdId'; // TODO: Replace with your actual product ID

  // Build the payload for Creem
  const payload = {
    product_id: PRODUCT_ID,
    customer: { email }, // pre-fill email
  };
  if (userId) payload.metadata = { userId, ...(metadata || {}) };
  if (request_id) payload.request_id = request_id;
  if (success_url) payload.success_url = success_url;

  const res = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'x-api-key': CREEM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  return new Response(JSON.stringify({ url: data.checkout_url }), {
    headers: { "Content-Type": "application/json" }
  });
} 
