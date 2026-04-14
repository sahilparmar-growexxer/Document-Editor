import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="bn-page" style={{ overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        backdropFilter: 'blur(8px)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
      }}>
        <div style={{
          maxWidth: '1280px',
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}>
              B
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>BlockNote</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/login"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#4b5563',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => e.target.style.color = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.color = '#4b5563'}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '4rem 1.5rem' }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1100px',
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            {/* Left Content */}
            <div>
              <span style={{
                display: 'inline-block',
                borderRadius: '9999px',
                border: '1px solid #d4d4d8',
                backgroundColor: '#faf5ff',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#7c3aed',
                marginBottom: '1.5rem',
              }}>
                ✨ Modern Block Editor
              </span>

              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                color: '#111827',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Build Your Workspace
              </h1>

              <p style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: '#6b7280',
                marginBottom: '2rem',
                maxWidth: '28rem',
              }}>
                A modern, intuitive block-based editor with built-in collaboration, authentication, and a production-ready API.
              </p>

              {/* Feature List */}
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem', maxWidth: '28rem' }}>
                {[
                  'Rich block editor interface',
                  'Real-time document collaboration',
                  'Fully authenticated backend',
                ].map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7c3aed',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}>
                      ✓
                    </div>
                    <span style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    padding: '1rem 1.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#7c3aed';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#8b5cf6';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                  }}
                >
                  Start Free
                  <span>→</span>
                </Link>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #d4d4d8',
                    backgroundColor: '#fff',
                    color: '#4b5563',
                    padding: '1rem 1.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
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
                  Dashboard
                </Link>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Card 1 */}
              <div style={{
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                padding: '2rem',
                backgroundColor: '#faf5ff',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}>
                  📝
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Rich Editor</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Intuitive blocks with full formatting options</p>
              </div>

              {/* Card 2 */}
              <div style={{
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                padding: '2rem',
                backgroundColor: '#fff',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#faf5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}>
                  🔒
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Secure Auth</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>JWT authentication with refresh tokens</p>
              </div>

              {/* Card 3 */}
              <div style={{
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                padding: '2rem',
                backgroundColor: '#faf5ff',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}>
                  ⚡
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Production Ready</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>API, database, and deployment included</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        padding: '4rem 1.5rem',
        background: 'linear-gradient(135deg, #f9fafb 0%, #faf5ff 100%)',
        borderTop: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Ready to build?</h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
            Join developers building the next generation of block-based applications.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#8b5cf6',
              color: '#fff',
              padding: '1rem 2rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#7c3aed';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#8b5cf6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
            }}
          >
            Create Account
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
