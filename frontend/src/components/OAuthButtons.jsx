import { useState, useEffect, useRef } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { API, GOOGLE_CLIENT_ID } from '../services/api';

export function useOAuthPopup(provider, onSuccess, onError) {
  const [loading, setLoading] = useState(false);
  function open() {
    setLoading(true);
    const popup = window.open(
      `${API}/api/auth/${provider}/init`,
      `${provider}_auth`,
      'width=600,height=700,scrollbars=yes,resizable=yes',
    );
    if (!popup || popup.closed) {
      setLoading(false);
      onError('Popup was blocked. Please allow popups for this site and try again.');
      return;
    }
    function onMessage(event) {
      try { if (new URL(API).origin !== event.origin) return; } catch { return; }
      if (event.data?.type === 'OAUTH_SUCCESS') {
        cleanup();
        onSuccess({ token: event.data.token, user: event.data.user });
      } else if (event.data?.type === 'OAUTH_ERROR') {
        cleanup();
        onError(event.data.error || `${provider} sign-in failed.`);
      }
    }
    function cleanup() {
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      setLoading(false);
    }
    window.addEventListener('message', onMessage);
    const poll = setInterval(() => {
      try { if (popup.closed) cleanup(); } catch { cleanup(); }
    }, 500);
  }
  return { loading, open };
}

export function GoogleSignInButton({ onSuccess, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const tryInit = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const r = await fetch(`${API}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            const d = await r.json();
            if (!r.ok) { onError(d.error || 'Google sign-in failed'); return; }
            onSuccess(d);
          } catch { onError('Network error. Try again.'); }
        },
      });
      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black', size: 'large', width: containerRef.current.offsetWidth || 358,
          text: 'continue_with', shape: 'rectangular',
        });
      }
    };
    if (window.google) { tryInit(); } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
      if (script) script.addEventListener('load', tryInit);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} style={{ width: '100%', marginBottom: 8 }} />;
}

export function GitHubSignInButton({ onSuccess, onError }) {
  const { loading, open } = useOAuthPopup('github', onSuccess, onError);
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      title="Continue with GitHub"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: hov ? '#21262d' : '#161b22',
        border: `1px solid ${hov ? '#8b949e' : '#30363d'}`,
        borderRadius: 8, color: '#e6edf3', fontFamily: C.mono, fontSize: 13, fontWeight: 600,
        padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'border-color .15s, background .15s', opacity: loading ? 0.7 : 1,
      }}
    >
      {Ic.github}
      <span>{loading ? 'Connecting…' : 'GitHub'}</span>
    </button>
  );
}

export function DiscordSignInButton({ onSuccess, onError }) {
  const { loading, open } = useOAuthPopup('discord', onSuccess, onError);
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      title="Continue with Discord"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: hov ? '#5865f2' : '#404eed',
        border: `1px solid ${hov ? '#5865f2' : '#404eed'}`,
        borderRadius: 8, color: '#fff', fontFamily: C.mono, fontSize: 13, fontWeight: 600,
        padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'border-color .15s, background .15s', opacity: loading ? 0.7 : 1,
      }}
    >
      {Ic.discord}
      <span>{loading ? 'Connecting…' : 'Discord'}</span>
    </button>
  );
}
