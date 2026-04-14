import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BlockEditor from '../components/editor/BlockEditor';
import { apiFetch, getAccessToken } from '../lib/apiClient';

export default function DocumentEditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocument() {
    setLoading(true);
    setError('');
    try {
      const rows = await apiFetch('/documents');
      const found = rows.find((item) => item.id === documentId);
      if (!found) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      setDocument(found);
      setTitle(found.title || 'Untitled');
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) {
      navigate('/login');
      return;
    }

    loadDocument();
  }, [documentId, navigate]);

  async function saveTitle() {
    if (!document) return;
    const next = title.trim();
    if (!next || next === document.title) return;

    try {
      const updated = await apiFetch(`/documents/${document.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: next })
      });
      setDocument(updated);
      setTitle(updated.title || 'Untitled');
    } catch (err) {
      setError(err.message || 'Failed to save title');
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10 text-slate-200">
        Loading document...
      </main>
    );
  }

  if (!document) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10 text-slate-200">
        <p className="mb-4 text-rose-300">{error || 'Document not found'}</p>
        <Link to="/dashboard" className="text-cyan-300 hover:text-cyan-200">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="text-sm text-cyan-300 transition hover:text-cyan-200">
            Back to dashboard
          </Link>
          {document.is_public ? (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200">
              Public link enabled
            </span>
          ) : null}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-3 text-2xl font-semibold text-slate-100"
        />
      </header>

      {error ? <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      <BlockEditor
        document={document}
        onDocumentMetaChange={(updated) => {
          setDocument(updated);
        }}
      />
    </main>
  );
}
