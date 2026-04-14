import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, clearTokens, getAccessToken } from '../lib/apiClient';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('Untitled Document');
  const [editingId, setEditingId] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');

  async function loadDocuments() {
    try {
      const data = await apiFetch('/documents');
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) {
      navigate('/login');
      return;
    }

    setIsAuthed(true);
    loadDocuments();
  }, [navigate]);

  async function createDocument(e) {
    e.preventDefault();
    setError('');

    try {
      await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      setTitle('Untitled Document');
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDocument(id) {
    setError('');

    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  function startRename(doc) {
    setError('');
    setEditingId(doc.id);
    setEditingTitle(doc.title || 'Untitled');
  }

  function cancelRename() {
    setEditingId('');
    setEditingTitle('');
  }

  async function saveRename(id) {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      setError('Title cannot be empty');
      return;
    }

    setError('');
    try {
      await apiFetch(`/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: nextTitle })
      });
      cancelRename();
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    clearTokens();
    navigate('/login');
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-300">Create and manage your private documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Home
          </Link>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Logout
          </button>
        </div>
      </header>

      <form onSubmit={createDocument} className="glass mb-6 flex flex-col gap-3 rounded-2xl p-4 md:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-400"
          placeholder="Document title"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Create
        </button>
      </form>

      {error ? <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      <ul className="space-y-3">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-4"
          >
            {editingId === doc.id ? (
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveRename(doc.id)}
                    className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelRename}
                    className="rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between gap-3">
                <p className="font-medium text-slate-100">{doc.title || 'Untitled'}</p>
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/${doc.id}`}
                    className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => startRename(doc)}
                    className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!documents.length ? (
        <p className="mt-6 text-sm text-slate-400">No documents yet. Create your first one above.</p>
      ) : null}
    </main>
  );
}
