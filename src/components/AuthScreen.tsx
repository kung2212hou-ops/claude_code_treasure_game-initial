import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthUser {
  id: number;
  username: string;
}

interface AuthScreenProps {
  onSuccess: (user: AuthUser, token: string) => void;
  onGuest: () => void;
}

export default function AuthScreen({ onSuccess, onGuest }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (mode: 'signup' | 'signin') => {
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      onSuccess(data.user, data.token);
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formFields = (mode: 'signup' | 'signin') => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-username`}>Username</Label>
        <Input
          id={`${mode}-username`}
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username"
          onKeyDown={e => e.key === 'Enter' && submit(mode)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          onKeyDown={e => e.key === 'Enter' && submit(mode)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        onClick={() => submit(mode)}
        disabled={loading}
      >
        {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl mb-2 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
      <p className="text-amber-700 mb-8 text-sm">Sign in to save your scores</p>

      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border-2 border-amber-300 p-6">
        <Tabs defaultValue="signin" onValueChange={() => setError('')}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">{formFields('signin')}</TabsContent>
          <TabsContent value="signup">{formFields('signup')}</TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t border-amber-200 text-center">
          <Button variant="ghost" className="text-amber-700 hover:text-amber-900" onClick={onGuest}>
            Play as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
