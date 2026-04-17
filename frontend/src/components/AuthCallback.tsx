import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * AuthCallback wraps the app and intercepts OAuth hash-fragment redirects.
 * When the URL contains an access_token in the hash (e.g. /dashboard#access_token=...),
 * it waits for Supabase to process the token and establish a session before rendering children.
 */
export default function AuthCallback({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const hasOAuthToken = hash.includes('access_token=');

    if (!hasOAuthToken) {
      // No OAuth redirect — render immediately
      setReady(true);
      return;
    }

    // OAuth redirect detected — wait for Supabase to process the hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Session established — clear the hash and navigate to the intended path
        const targetPath = location.pathname || '/dashboard';
        subscription.unsubscribe();
        setReady(true);
        // Replace current URL to remove the hash fragment
        navigate(targetPath, { replace: true });
      }
    });

    // Timeout fallback: if Supabase doesn't fire within 5 seconds, render anyway
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8B8BA7] text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}