import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, setTokens } from '../lib/apiClient';

export default function RegisterPage() {
  const navigate = useNavigate();
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="bn-page">
      <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <section style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Create Your Account</h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '2rem' }}>Get started with your workspace in under a minute.</p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#1f2937',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
              }}
            />
            <input
              type="password"
              placeholder="Password (min 8, 1 number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#1f2937',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                borderRadius: '0.75rem',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                padding: '0.85rem 1rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              Register
            </button>
          </form>

          {error ? <p style={{ marginTop: '1rem', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#be123c', fontSize: '0.85rem' }}>{error}</p> : null}

          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
