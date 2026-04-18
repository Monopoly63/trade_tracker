import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authRepo } from '@/lib/repository';
import { isSupabaseConfigured } from '@/lib/supabase';
import LandingPage from './LandingPage';

export default function Index() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    authRepo.getSession().then((session) => {
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      } else {
        setChecking(false);
      }
    }).catch(() => {
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06060e]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LandingPage />;
}