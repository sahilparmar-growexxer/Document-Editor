'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setTokens } from '../../lib/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="glass w-full max-w-md rounded-3xl p-8 md:p-10">
        <h1 className="mb-2 text-3xl font-semibold text-white">Create Your Account</h1>
        <p className="mb-8 text-sm text-slate-300">Get started with your workspace in under a minute.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-400"
          />
          <input
            type="password"
            placeholder="Password (min 8, 1 number)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-400"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Register
          </button>
        </form>

        {error ? <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      </section>
    </main>
  );
}
