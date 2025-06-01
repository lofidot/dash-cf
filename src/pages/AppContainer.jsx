import { useEffect, useState } from "react";

// Basic Modal styles (inline for simplicity, can move to CSS)
const modalStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyles = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  textAlign: 'center',
  minWidth: '300px',
};

const formStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginTop: '20px',
};

const inputStyles = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const buttonStyles = {
  padding: '10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
};

const switchLinkStyles = {
  marginTop: '20px',
  cursor: 'pointer',
  color: '#007bff',
  textDecoration: 'underline',
};


export default function AppContainer({ user, supabase }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(false); // true for login, false for register/upgrade
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);


  // --- Check User Status and Show Modal ---
  useEffect(() => {
    async function checkUserStatus() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (currentUser) {
        // Fetch profile from 'profiles' table (must have 'plus' boolean column)
        const { data, error } = await supabase
          .from('profiles')
          .select('plus')
          .eq('id', currentUser.id)
          .single();

        if (!error && data) {
          setIsPlusUser(!!data.plus);
          // If logged in but not plus, show the upgrade part of the modal
          if (!data.plus) {
            setShowModal(true);
            setIsLoginForm(false); // Show upgrade button, not login form initially
          }
        } else {
          // Error fetching profile or no profile, assume not plus
          setIsPlusUser(false);
          setShowModal(true); // Show modal for logged-in non-plus
          setIsLoginForm(false); // Show upgrade button
        }
      } else {
        // Not logged in, show register/login modal
        setIsPlusUser(false);
        setShowModal(true);
        setIsLoginForm(false); // Show register form initially
      }
      setLoading(false);
    }

    checkUserStatus();

    // Listen for auth state changes to update modal visibility
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        if (currentUser) {
            // Re-check status on auth change
            checkUserStatus();
        } else {
            // Logged out, show modal
            setIsPlusUser(false);
            setShowModal(true);
            setIsLoginForm(false); // Show register form
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };

  }, [supabase]); // Depend on supabase client


  // --- Handlers ---

  // Handle Register and Pay for new users
  async function handleRegisterAndPay(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // 1. Create user in Supabase
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (signUpError) {
      setFormError(signUpError.message);
      setFormLoading(false);
      return;
    }

    // 2. Launch Creem checkout
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUser.email,
        userId: newUser.id,
        request_id: newUser.id,
        success_url: window.location.origin, // Redirect back to homepage on success
      })
    });
    const data = await res.json();
    setFormLoading(false);

    if (data.url) {
      window.location.href = data.url; // Redirect to Creem checkout
    } else {
      setFormError('Failed to start checkout. Please try again.');
    }
  }

  // Handle Upgrade for logged-in non-plus users
  async function handleUpgrade() {
    setFormError('');
    setFormLoading(true);

    if (!user) { // Should not happen if logic is correct, but as a safeguard
        setFormError('You must be logged in to upgrade.');
        setFormLoading(false);
        return;
    }

    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            userId: user.id,
            request_id: user.id,
            success_url: window.location.origin,
        })
    });
    const data = await res.json();
    setFormLoading(false);

    if (data.url) {
        window.location.href = data.url;
    } else {
        setFormError('Failed to start checkout. Please try again.');
    }
  }

  // Handle Login
  async function handleLogin(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    setFormLoading(false);
    if (loginError) {
      setFormError(loginError.message);
    } else {
        // Login successful, auth listener will update state and potentially close modal
        setShowModal(false);
    }
  }

  // Render loading state while checking auth initially
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading app...</div>;
  }

  // Render the app content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* The embedded iframe for the core app */}
      <div style={{height: "80vh", width: "100%", maxWidth: 900, border: "1px solid #ccc", marginTop: 20}}>
          <iframe
            // Pass user status via query params (or remove if core app handles auth separately)
            src={`/core/index.html?premium=${isPlusUser ? '1' : '0'}&user=${user ? encodeURIComponent(user.email) : ''}`}
            title="Ambient Sound Player"
            width="100%"
            height="100%"
            style={{border: "none"}}
            allow="autoplay"
          />
      </div>

      {/* Logout button for logged-in users */}
      {user && (
          <button className="mt-6 text-red-500" onClick={() => supabase.auth.signOut()}>Logout</button>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div style={modalStyles}>
          <div style={modalContentStyles}>
            {user && !isPlusUser ? (
              // Logged in but not Plus: Show Upgrade button
              <>
                <h2>Upgrade to Plus</h2>
                <p>Unlock premium features by upgrading.</p>
                {formError && <div style={{ color: 'red' }}>{formError}</div>}
                <button style={buttonStyles} onClick={handleUpgrade} disabled={formLoading}>
                  {formLoading ? 'Processing...' : 'Upgrade to Plus'}
                </button>
              </>
            ) : (
              // Not logged in: Show Register/Login forms
              <>
                <h2>{isLoginForm ? 'Login' : 'Create Account & Upgrade'}</h2>
                {formError && <div style={{ color: 'red' }}>{formError}</div>}
                <form onSubmit={isLoginForm ? handleLogin : handleRegisterAndPay} style={formStyles}>
                  <input
                    style={inputStyles}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <input
                    style={inputStyles}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button style={buttonStyles} type="submit" disabled={formLoading}>
                    {formLoading ? 'Processing...' : (isLoginForm ? 'Login' : 'Create Account & Upgrade')}
                  </button>
                </form>
                <p style={switchLinkStyles} onClick={() => setIsLoginForm(!isLoginForm)}>
                  {isLoginForm ? 'Need an account? Create Account & Upgrade' : 'Already have an account? Login'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
