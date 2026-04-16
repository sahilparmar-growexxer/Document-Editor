import Skeleton from './Skeleton';

export function DashboardPageSkeleton() {
  return (
    <main className="bn-page">
      <div className="bn-stage" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '55%' }}>
            <Skeleton style={{ width: '42%', height: '2.2rem', marginBottom: '0.7rem', borderRadius: '0.7rem' }} />
            <Skeleton style={{ width: '70%', height: '1rem', borderRadius: '0.6rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', width: '250px' }}>
            <Skeleton style={{ height: '2.3rem', flex: 1, borderRadius: '0.75rem' }} />
            <Skeleton style={{ height: '2.3rem', flex: 1, borderRadius: '0.75rem' }} />
          </div>
        </header>

        <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff', padding: '1rem' }}>
          <Skeleton style={{ width: '100%', height: '2.8rem', borderRadius: '0.75rem' }} />
        </div>

        <div style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff', padding: '1rem' }}>
          <Skeleton style={{ width: '26%', height: '0.95rem', marginBottom: '0.55rem', borderRadius: '0.55rem' }} />
          <Skeleton style={{ width: '100%', height: '2.7rem', borderRadius: '0.75rem' }} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                style={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '45%' }}>
                  <Skeleton style={{ width: '80%', height: '1rem', marginBottom: '0.5rem' }} />
                  <Skeleton style={{ width: '45%', height: '0.75rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', width: '230px' }}>
                  <Skeleton style={{ height: '2rem', flex: 1, borderRadius: '0.5rem' }} />
                  <Skeleton style={{ height: '2rem', flex: 1, borderRadius: '0.5rem' }} />
                  <Skeleton style={{ height: '2rem', flex: 1, borderRadius: '0.5rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function DocumentEditorPageSkeleton() {
  return (
    <main className="bn-page">
      <header className="bn-top-nav">
        <Skeleton style={{ width: '120px', height: '1.05rem' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Skeleton style={{ width: '82px', height: '2rem', borderRadius: '999px' }} />
          <Skeleton style={{ width: '98px', height: '2rem', borderRadius: '999px' }} />
          <Skeleton style={{ width: '86px', height: '2rem', borderRadius: '999px' }} />
        </div>
      </header>

      <section className="bn-stage">
        <Skeleton style={{ width: '250px', height: '2.4rem', margin: '0 auto 1rem', borderRadius: '0.7rem' }} />

        <div className="bn-collab-bar">
          <Skeleton style={{ width: '90px', height: '0.9rem' }} />
          <Skeleton style={{ width: '100%', height: '2.25rem', borderRadius: '0.55rem' }} />
          <Skeleton style={{ width: '110px', height: '2.25rem', borderRadius: '0.55rem' }} />
        </div>

        <div className="bn-window" style={{ marginTop: '0.75rem' }}>
          <div className="bn-window-head">
            <div className="bn-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="bn-window-actions" style={{ width: '190px' }}>
              <Skeleton style={{ width: '72px', height: '1.8rem', borderRadius: '0.45rem' }} />
              <Skeleton style={{ width: '66px', height: '1.8rem', borderRadius: '0.45rem' }} />
            </div>
          </div>

          <div className="bn-window-body">
            <aside className="bn-docs-sidebar">
              <div style={{ padding: '0.7rem 0.8rem 0.5rem' }}>
                <Skeleton style={{ width: '110px', height: '0.9rem' }} />
              </div>
              <div style={{ margin: '0.4rem 0.65rem 0.6rem' }}>
                <Skeleton style={{ width: '100%', height: '2rem', borderRadius: '0.35rem' }} />
              </div>
              <div style={{ padding: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} style={{ width: '100%', height: '2.35rem', borderRadius: '0.35rem' }} />
                ))}
              </div>
            </aside>

            <section className="bn-editor-col">
              <Skeleton style={{ width: '55%', height: '1.8rem', marginBottom: '0.7rem' }} />
              <div className="editor-shell" style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} style={{ width: '100%', height: '2rem', borderRadius: '0.5rem' }} />
                  ))}
                </div>
              </div>
            </section>

            <aside className="bn-command-panel">
              <div style={{ padding: '0.6rem 0.7rem' }}>
                <Skeleton style={{ width: '80px', height: '0.8rem', marginBottom: '0.35rem' }} />
                <Skeleton style={{ width: '120px', height: '0.65rem' }} />
              </div>
              <div style={{ padding: '0.6rem 0.7rem', display: 'grid', gap: '0.35rem' }}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} style={{ width: '100%', height: '1.6rem', borderRadius: '0.55rem' }} />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PublicSharePageSkeleton() {
  return (
    <main className="bn-page">
      <div className="bn-stage">
        <header style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
          <Skeleton style={{ width: '92px', height: '2rem', borderRadius: '0.5rem', marginBottom: '1rem' }} />
          <Skeleton style={{ width: '110px', height: '0.75rem', marginBottom: '0.6rem' }} />
          <Skeleton style={{ width: '52%', height: '2.1rem', borderRadius: '0.6rem' }} />
        </header>

        <section style={{ borderRadius: '0.75rem', border: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '2rem' }}>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <Skeleton style={{ width: '38%', height: '1.75rem', borderRadius: '0.5rem' }} />
            <Skeleton style={{ width: '100%', height: '0.95rem' }} />
            <Skeleton style={{ width: '93%', height: '0.95rem' }} />
            <Skeleton style={{ width: '86%', height: '0.95rem' }} />
            <Skeleton style={{ width: '100%', height: '9rem', borderRadius: '0.65rem', marginTop: '0.5rem' }} />
            <Skeleton style={{ width: '76%', height: '0.95rem' }} />
            <Skeleton style={{ width: '88%', height: '0.95rem' }} />
          </div>
        </section>
      </div>
    </main>
  );
}

export function BlockEditorSkeleton() {
  return (
    <section className="editor-shell">
      <div className="editor-toolbar" style={{ marginBottom: '0.9rem' }}>
        <Skeleton style={{ width: '110px', height: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton style={{ width: '120px', height: '2rem', borderRadius: '0.7rem' }} />
          <Skeleton style={{ width: '100px', height: '2rem', borderRadius: '0.7rem' }} />
        </div>
      </div>

      <div className="editor-canvas" style={{ gap: '0.55rem' }}>
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="editor-block" style={{ gap: '0.7rem', padding: '0.35rem 0.2rem' }}>
            <Skeleton style={{ width: '1rem', height: '1rem', borderRadius: '0.4rem', marginTop: '0.35rem' }} />
            <Skeleton style={{ width: '100%', height: index === 2 ? '4.5rem' : '2rem', borderRadius: '0.55rem' }} />
          </div>
        ))}
        <Skeleton style={{ width: '110px', height: '2rem', borderRadius: '0.55rem' }} />
      </div>
    </section>
  );
}
