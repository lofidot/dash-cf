import { useEffect, useState } from "react";

export default function Dashboard({ user, supabase }) {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Call your API endpoint (Cloudflare Function)
    fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, email: user.email }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => setSubscription(data));
  }, [user.id, user.email]);

  const isPremium = subscription && subscription.status === 'active';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.email}</h1>
      <div className="mb-4">
        <span className="font-semibold">Subscription status:</span>{" "}
        {subscription ? subscription.status || 'No subscription' : "Loading..."}
      </div>
      {!isPremium && (
        <a href={subscription?.url || '#'} className="bg-green-600 text-white px-4 py-2 rounded">Upgrade to Plus</a>
      )}
      {isPremium && (
        <div style={{height: "80vh", width: "100%", maxWidth: 900, border: "1px solid #ccc", marginTop: 20}}>
          <iframe
            src={`/core/index.html?premium=1&user=${encodeURIComponent(user.email)}`}
            title="Ambient Sound Player"
            width="100%"
            height="100%"
            style={{border: "none"}}
            allow="autoplay"
          />
        </div>
      )}
      <button className="mt-6 text-red-500" onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  );
} 
