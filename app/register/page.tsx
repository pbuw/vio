'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Das Konto konnte nicht erstellt werden. Bitte versuche es noch einmal.');
        return;
      }

      // Redirect to login page
      router.push('/login?registered=true');
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
          Registrieren
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-[#FF8080]/10 border border-[#FF8080]/20 rounded-xl text-[#FF8080] text-sm font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
              placeholder="Dein Name"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Konto wird erstellt...' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#2D3436]/60 font-inter">
          Bereits ein Konto?{' '}
          <Link
            href="/login"
            className="text-[#5844AC] font-medium hover:text-[#5844AC]/80 transition-colors"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}

