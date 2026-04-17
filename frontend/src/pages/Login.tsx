import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authRepo } from '@/lib/repository';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertCircle, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await authRepo.signIn(form.get('email') as string, form.get('password') as string);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await authRepo.signUp(form.get('email') as string, form.get('password') as string);
      toast.success('Account created! Check your email for verification.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
  try {
    setLoading(true)
    setError('')
    await authRepo.signInWithGoogle()
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Google sign in failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-4">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">TradeJournal</h1>
          <p className="text-[#8B8BA7] mt-2">Trading Journal & Risk Analysis System</p>
        </div>

        {!isSupabaseConfigured && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <WifiOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-500 mb-1">Supabase Not Connected</p>
                <p className="text-[#8B8BA7]">
                  Please connect your Supabase project via the platform UI to enable authentication.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#1E1E2E] bg-[#111118]">
          <Tabs defaultValue="signin">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2 bg-[#0A0A0F]">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            {error && (
              <div className="mx-6 mb-2 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <CardDescription className="text-[#8B8BA7]">Sign in to your trading journal</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="si-email" className="text-[#8B8BA7]">Email</Label>
                    <Input id="si-email" name="email" type="email" placeholder="trader@example.com" required
                      className="bg-[#0A0A0F] border-[#1E1E2E] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass" className="text-[#8B8BA7]">Password</Label>
                    <Input id="si-pass" name="password" type="password" placeholder="••••••••" required
                      className="bg-[#0A0A0F] border-[#1E1E2E] text-white" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading || !isSupabaseConfigured}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <CardDescription className="text-[#8B8BA7]">Create a new account</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="su-email" className="text-[#8B8BA7]">Email</Label>
                    <Input id="su-email" name="email" type="email" placeholder="trader@example.com" required
                      className="bg-[#0A0A0F] border-[#1E1E2E] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass" className="text-[#8B8BA7]">Password</Label>
                    <Input id="su-pass" name="password" type="password" placeholder="••••••••" minLength={6} required
                      className="bg-[#0A0A0F] border-[#1E1E2E] text-white" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading || !isSupabaseConfigured}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
