import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedDocument } from '../lib/apiClient';

function renderBlock(block) {
  const text = block?.content?.text || '';

  if (block.type === 'heading') {
    return <h2 className="share-heading">{text || 'Untitled section'}</h2>;
  }

  if (block.type === 'code') {
    return <pre className="share-code">{text}</pre>;
  }

  if (block.type === 'todo') {
    return (
      <div className="share-todo">
        <span aria-hidden="true">[]</span>
        <span>{text}</span>
      </div>
    );
  }

  if (block.type === 'divider') {
    return <hr className="share-divider" />;
  }

  return <p className="share-paragraph">{text || ' '}</p>;
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
      <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10 text-slate-200">
        Loading shared document...
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10 text-slate-200">
        <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error || 'Shared document not found'}
        </p>
        <Link to="/" className="text-cyan-300 hover:text-cyan-200">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <header className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300">Shared Document</p>
        <h1 className="text-3xl font-semibold text-slate-100">{payload.document.title || 'Untitled'}</h1>
      </header>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6">
        {payload.blocks.length ? (
          payload.blocks.map((block) => <div key={block.id}>{renderBlock(block)}</div>)
        ) : (
          <p className="text-sm text-slate-300">No content</p>
        )}
      </section>
    </main>
  );
}
