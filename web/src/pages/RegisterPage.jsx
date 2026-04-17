import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, setTokens } from '../lib/apiClient';

export default function RegisterPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%',
    borderRadius: '0.8rem',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#1f2937',
    padding: '0.8rem 1rem',
    fontSize: '0.95rem',
    outline: 'none'
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password and confirm password must match');
      return;
    }

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setTokens(data.tokens.accessToken);
      if (typeof onAuthSuccess === 'function') {
        onAuthSuccess();
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="bn-page">
      <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <section
          style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '1.1rem',
            border: '1px solid #e5e7eb',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            boxShadow: '0 20px 45px rgba(37, 99, 235, 0.08)',
            padding: '1.5rem'
          }}
        >
          <p style={{ margin: 0, display: 'inline-block', borderRadius: '999px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.28rem 0.68rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            CREATE ACCOUNT
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.9rem 0 0.45rem' }}>Start Your Workspace</h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: 0 }}>Create an account to manage documents and collaborate faster.</p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem', marginTop: '1.35rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password (min 8, 1 number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                borderRadius: '0.8rem',
                background: 'linear-gradient(120deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                padding: '0.88rem 1rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.filter = 'brightness(1.03)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.filter = 'brightness(1)';
              }}
            >
              Register
            </button>
          </form>

          {error ? <p style={{ marginTop: '0.9rem', padding: '0.62rem', borderRadius: '0.58rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#be123c', fontSize: '0.85rem' }}>{error}</p> : null}

          <p style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
