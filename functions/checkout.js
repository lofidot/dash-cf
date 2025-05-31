export async function onRequestPost(context) {
  const { userId, email } = await context.request.json();
  const CREEM_API_KEY = context.env.CREEM_API_KEY;

  const res = await fetch('https://api.creem.io/v1/checkout/session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CREEM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: { id: userId, email }
      // ...other required fields
    })
  });
  const data = await res.json();

  return new Response(JSON.stringify({ url: data.url }), {
    headers: { "Content-Type": "application/json" }
  });
} 