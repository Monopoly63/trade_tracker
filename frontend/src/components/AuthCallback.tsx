import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * AuthCallback wraps the app and intercepts OAuth redirects.
 * Handles two flows:
 * 1. Hash-fragment: /dashboard#access_token=...
 * 2. PKCE code flow: /dashboard?code=...
 */
export default function AuthCallback({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const hasOAuthToken = hash.includes('access_token=');

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (!hasOAuthToken && !code) {
      // No OAuth redirect — render immediately
      setReady(true);
      return;
    }

    if (code) {
      // PKCE code flow: exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('Failed to exchange code for session:', error.message);
        }
        const targetPath = location.pathname || '/dashboard';
        setReady(true);
        // Clean up the URL by removing the ?code= query param
        navigate(targetPath, { replace: true });
      });
      return;
    }

    // Hash-fragment flow: wait for Supabase to process the token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const targetPath = location.pathname || '/dashboard';
        subscription.unsubscribe();
        setReady(true);
        navigate(targetPath, { replace: true });
      }
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      setReady(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="theme-text-secondary text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}