import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BlockEditor from '../components/editor/BlockEditor';
import {
  apiFetch,
  clearTokens,
  enableDocumentShare,
  disableDocumentShare,
  getAccessToken
} from '../lib/apiClient';

export default function DocumentEditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collabUrl, setCollabUrl] = useState('');
  const [commandRequest, setCommandRequest] = useState(null);

  function runEditorCommand(action, value = '') {
    setCommandRequest({ action, value, stamp: Date.now() });
  }

  function getRelativeDayLabel(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - target) / 86400000);

    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  }

  function getDocumentTimestamp(item) {
    return item.updated_at || item.updatedAt || item.created_at || item.createdAt || null;
  }

  async function createNewDocument() {
    setError('');
    try {
      const created = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled' })
      });
      setDocuments((prev) => [created, ...prev]);
      navigate(`/dashboard/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create document');
    }
  }

  async function loadDocument() {
    setLoading(true);
    setError('');
    try {
      const rows = await apiFetch('/documents');
      setDocuments(rows);
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
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Failed to save title');
    }
  }

  async function handleEnableShare() {
    if (!document) return;
    try {
      const updated = await enableDocumentShare(document.id);
      setDocument(updated);
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setCollabUrl('Enable sharing to generate collaboration URL');
    } catch (err) {
      setError(err.message || 'Could not disable share');
    }
  }

  async function copyCollabUrl() {
    if (!document?.is_public || !document?.share_token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${document.share_token}`);
  }

  function logout() {
    clearTokens();
    navigate('/login');
  }

  if (loading) {
    return (
      <main className="bn-page">
        <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                animation: 'bn-spin 1s linear infinite'
              }}
            />
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>Loading document...</p>
            <style>{`@keyframes bn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="bn-page">
        <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}>
            <p
              style={{
                marginBottom: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #fecdd3',
                backgroundColor: '#fff1f2',
                color: '#be123c',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem'
              }}
            >
              {error || 'Document not found'}
            </p>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-block',
                borderRadius: '0.75rem',
                border: '1px solid #d4d4d8',
                backgroundColor: '#fff',
                color: '#4b5563',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#a78bfa';
                e.target.style.color = '#6d28d9';
                e.target.style.backgroundColor = '#faf5ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#d4d4d8';
                e.target.style.color = '#4b5563';
                e.target.style.backgroundColor = '#fff';
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const orderedDocuments = [...documents].sort((a, b) => {
    const aTime = new Date(getDocumentTimestamp(a) || 0).getTime();
    const bTime = new Date(getDocumentTimestamp(b) || 0).getTime();
    return bTime - aTime;
  });

  return (
    <main className="bn-page">
      <header className="bn-top-nav">
        <Link to="/dashboard" className="bn-brand">BlockNote</Link>
        <nav>
          <Link to="/" className="bn-nav-link">Home</Link>
          <Link to="/dashboard" className="bn-nav-link">Dashboard</Link>
          <button type="button" onClick={logout} className="bn-nav-button">Logout</button>
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
            <aside className="bn-docs-sidebar">
              <div className="bn-docs-sidebar-brand">BlockNote</div>
              <button type="button" className="bn-docs-new" onClick={createNewDocument}>
                +
                <span>New Document</span>
              </button>
              <div className="bn-docs-sidebar-divider" />
              <div className="bn-docs-list">
                {orderedDocuments.length ? (
                  orderedDocuments.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`bn-docs-item${item.id === document.id ? ' is-active' : ''}`}
                      onClick={() => {
                        if (item.id !== document.id) {
                          navigate(`/dashboard/${item.id}`);
                        }
                      }}
                    >
                      <span className="bn-docs-item-title">{item.title || 'Untitled'}</span>
                      <span className="bn-docs-item-meta">{getRelativeDayLabel(getDocumentTimestamp(item))}</span>
                    </button>
                  ))
                ) : (
                  <p className="bn-docs-empty">No documents</p>
                )}
              </div>
            </aside>
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
                commandRequest={commandRequest}
                onDocumentMetaChange={(updated) => {
                  setDocument(updated);
                  setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }}
              />
            </section>
            <aside className="bn-command-panel">
              <header className="bn-command-head">
                <h3>Commands</h3>
                <p>Apply to focused block</p>
              </header>

              <div className="bn-command-list">
                <button type="button" onClick={() => runEditorCommand('set-type', 'paragraph')}>Paragraph</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'heading')}>Heading</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'todo')}>Todo</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'code')}>Code Block</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'divider')}>Divider</button>
                <button type="button" onClick={() => runEditorCommand('insert')}>+ Add New Block</button>
              </div>

              <p className="bn-command-note">
                Click inside a block first, then choose a command.
              </p>
            </aside>
          </div>
        </div>

        {error ? <p className="bn-banner-error">{error}</p> : null}
      </section>
    </main>
  );
}
