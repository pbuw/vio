'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccess(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ungültige E-Mail oder Passwort');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 border border-[#2D3436]/5">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-[#2D3436] font-poppins">vio</h1>
          <p className="text-[#2D3436]/60 font-inter">Deine Zusatzversicherung. Einfach genutzt.</p>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center text-[#2D3436] font-poppins">
          Anmelden
        </h2>

        {success && (
          <div className="mb-4 p-4 bg-[#00C896]/10 border border-[#00C896]/20 rounded-xl text-[#00C896] text-sm font-inter">
            Super! Dein Konto wurde erstellt. Bitte melde dich jetzt an.
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-[#FF8080]/10 border border-[#FF8080]/20 rounded-xl text-[#FF8080] text-sm font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
              placeholder="deine@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-poppins"
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#2D3436]/60 font-inter">
          Noch kein Konto?{' '}
          <Link
            href="/register"
            className="text-[#5844AC] font-medium hover:text-[#5844AC]/80 transition-colors"
          >
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
