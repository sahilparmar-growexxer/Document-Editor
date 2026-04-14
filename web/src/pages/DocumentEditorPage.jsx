import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BlockEditor from '../components/editor/BlockEditor';
import CommentsPanel from '../components/editor/CommentsPanel';
import {
  apiFetch,
  enableDocumentShare,
  disableDocumentShare,
  getAccessToken
} from '../lib/apiClient';

export default function DocumentEditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collabUrl, setCollabUrl] = useState('');

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
      const sharePath = found.share_token ? `/share/${found.share_token}` : '';
      setCollabUrl(sharePath ? `${window.location.origin}${sharePath}` : 'Enable sharing to generate collaboration URL');
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

  async function handleEnableShare() {
    if (!document) return;
    try {
      const updated = await enableDocumentShare(document.id);
      setDocument(updated);
      setCollabUrl(`${window.location.origin}/share/${updated.share_token}`);
    } catch (err) {
      setError(err.message || 'Could not enable share');
    }
  }

  async function handleDisableShare() {
    if (!document) return;
    try {
      const updated = await disableDocumentShare(document.id);
      setDocument(updated);
      setCollabUrl('Enable sharing to generate collaboration URL');
    } catch (err) {
      setError(err.message || 'Could not disable share');
    }
  }

  async function copyCollabUrl() {
    if (!document?.is_public || !document?.share_token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${document.share_token}`);
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
    <main className="bn-page">
      <header className="bn-top-nav">
        <Link to="/dashboard" className="bn-brand">BlockNote</Link>
        <nav>
          <a href="https://www.blocknotejs.org/docs" target="_blank" rel="noreferrer">Docs</a>
          <a href="https://www.blocknotejs.org/examples" target="_blank" rel="noreferrer">Examples</a>
          <span>Pricing</span>
        </nav>
      </header>

      <section className="bn-stage">
        <h1>
          Try <span>BlockNote</span>
        </h1>

        <div className="bn-collab-bar">
          <p>Collaborate live! Share this URL:</p>
          <input readOnly value={collabUrl} />
          <button type="button" onClick={copyCollabUrl} disabled={!document.is_public}>
            Copy Link
          </button>
        </div>

        <div className="bn-window">
          <div className="bn-window-head">
            <div className="bn-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="bn-window-actions">
              <button type="button" onClick={document.is_public ? handleDisableShare : handleEnableShare}>
                {document.is_public ? 'Disable Share' : 'Share'}
              </button>
              <span className="bn-separator" />
              <button type="button">Export</button>
            </div>
          </div>

          <div className="bn-window-body">
            <section className="bn-editor-col">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                className="bn-title-input"
              />
              <BlockEditor
                document={document}
                showShareControls={false}
                onDocumentMetaChange={(updated) => {
                  setDocument(updated);
                }}
              />
            </section>
            <CommentsPanel documentId={document.id} />
          </div>
        </div>

        {error ? <p className="bn-banner-error">{error}</p> : null}
      </section>
    </main>
  );
}
