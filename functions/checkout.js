export async function onRequestPost(context) {
  try {
    // Parse the incoming request body
    const body = await context.request.json();
    const { userId, email, product_id, request_id, metadata, success_url } = body;

    // Get environment variables
    const CREEM_API_KEY = context.env.CREEM_API_KEY;
    const DEFAULT_PRODUCT_ID = context.env.CREEM_PRODUCT_ID || 'prod_7BFwqeQGeKekfu9nPj8h9m';

    // Validate required fields
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!CREEM_API_KEY) {
      return new Response(JSON.stringify({ error: 'CREEM_API_KEY is not set in environment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use provided product_id or fallback to default
    const PRODUCT_ID = product_id || DEFAULT_PRODUCT_ID;

    // Build payload for Creem API
    const payload = {
      product_id: PRODUCT_ID,
      customer: { email },
      ...(userId || metadata ? { metadata: { userId, ...(metadata || {}) } } : {}),
      ...(request_id ? { request_id } : {}),
      ...(success_url ? { success_url } : {})
    };

    // Call Creem API
    const creemRes = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Handle Creem API errors
    if (!creemRes.ok) {
      const errorText = await creemRes.text();
      return new Response(JSON.stringify({ error: `Creem API error: ${creemRes.status} - ${errorText}` }), {
        status: creemRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse Creem API response
    const creemData = await creemRes.json();

    // Return checkout URL if available
    if (creemData.checkout_url) {
      return new Response(JSON.stringify({ url: creemData.checkout_url }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Creem API response missing checkout_url.', creemResponse: creemData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    // Catch-all error handler
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
