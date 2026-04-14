import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authRepo } from '@/lib/repository';
import { isSupabaseConfigured } from '@/lib/supabase';
import Login from './Login';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    authRepo.getSession().then((session) => {
      if (session?.user) navigate('/dashboard');
    }).catch(() => {});
  }, [navigate]);

  return <Login />;
}