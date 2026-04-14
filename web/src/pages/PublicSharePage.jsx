import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedDocument } from '../lib/apiClient';

function renderBlock(block) {
  const text = block?.content?.text || '';

  if (block.type === 'heading') {
    return <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', marginTop: '1.5rem' }}>{text || 'Untitled section'}</h2>;
  }

  if (block.type === 'code') {
    return (
      <pre style={{
        backgroundColor: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem',
        overflow: 'auto',
        fontSize: '0.875rem',
        color: '#374151',
        lineHeight: 1.6,
        marginBottom: '1rem',
      }}>
        {text}
      </pre>
    );
  }

  if (block.type === 'todo') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        marginBottom: '0.75rem',
        fontSize: '0.95rem',
        color: '#374151',
      }}>
        <span style={{ color: '#8b5cf6', fontWeight: 600 }}>☐</span>
        <span>{text}</span>
      </div>
    );
  }

  if (block.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />;
  }

  return <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.75rem' }}>{text || ' '}</p>;
}

export default function PublicSharePage() {
  const { token } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSharedDocument() {
      setLoading(true);
      setError('');

      try {
        const data = await getSharedDocument(token);
        if (!active) return;
        setPayload(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Shared document not found');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSharedDocument();

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="bn-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="bn-stage">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid #e5e7eb',
              borderTopColor: '#8b5cf6',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>Loading shared document...</p>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="bn-page">
        <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{
              marginBottom: '2rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              color: '#be123c',
              fontSize: '0.95rem',
            }}>
              {error || 'Shared document not found'}
            </div>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bn-page">
      <div className="bn-stage">
        <header style={{
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d4d4d8',
              backgroundColor: '#fff',
              color: '#4b5563',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#a78bfa';
              e.target.style.color = '#7c3aed';
              e.target.style.backgroundColor = '#faf5ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#d4d4d8';
              e.target.style.color = '#4b5563';
              e.target.style.backgroundColor = '#fff';
            }}
          >
            ← Back
          </Link>
          <div>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#8b5cf6',
              marginBottom: '0.5rem',
            }}>
              Shared Document
            </p>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}>
              {payload.document.title || 'Untitled'}
            </h1>
          </div>
        </header>

        <section style={{
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          padding: '2rem',
        }}>
          {payload.blocks.length ? (
            <div>
              {payload.blocks.map((block) => (
                <div key={block.id}>{renderBlock(block)}</div>
              ))}
            </div>
          ) : (
            <p style={{
              fontSize: '0.95rem',
              color: '#9ca3af',
              textAlign: 'center',
              padding: '2rem',
            }}>
              No content
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
