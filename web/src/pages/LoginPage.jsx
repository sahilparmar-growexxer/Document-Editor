import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, setTokens } from '../lib/apiClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);

      const docs = await apiFetch('/documents');
      if (Array.isArray(docs) && docs.length > 0) {
        navigate(`/dashboard/${docs[0].id}`);
        return;
      }

      const created = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled' })
      });
      navigate(`/dashboard/${created.id}`);
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
            maxWidth: '470px',
            borderRadius: '1.1rem',
            border: '1px solid #e5e7eb',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafaff 100%)',
            boxShadow: '0 20px 45px rgba(76, 29, 149, 0.08)',
            padding: '1.5rem'
          }}
        >
          <p style={{ margin: 0, display: 'inline-block', borderRadius: '999px', border: '1px solid #ddd6fe', backgroundColor: '#f5f3ff', color: '#6d28d9', padding: '0.28rem 0.68rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            SIGN IN
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.9rem 0 0.45rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: 0 }}>Open your workspace and continue writing from where you left off.</p>

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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                borderRadius: '0.8rem',
                background: 'linear-gradient(120deg, #8b5cf6 0%, #7c3aed 100%)',
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
              Login
            </button>
          </form>

          {error ? <p style={{ marginTop: '0.9rem', padding: '0.62rem', borderRadius: '0.58rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#be123c', fontSize: '0.85rem' }}>{error}</p> : null}

          <p style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
            Need an account?{' '}
            <Link to="/register" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 700 }}>
              Register
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
