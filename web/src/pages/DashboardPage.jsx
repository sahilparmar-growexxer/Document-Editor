import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, ensureSession, logoutSession, reorderDocument } from '../lib/apiClient';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');
  const [draggingDocumentId, setDraggingDocumentId] = useState('');

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const aOrder = Number(a.order_index || 0);
      const bOrder = Number(b.order_index || 0);
      if (aOrder === bOrder) {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return bTime - aTime;
      }
      return bOrder - aOrder;
    });
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedDocuments;

    return sortedDocuments.filter((doc) => (doc.title || 'Untitled').toLowerCase().includes(query));
  }, [sortedDocuments, searchQuery]);

  function getDocumentDateLabel(value) {
    if (!value) return 'recently';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recently';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - target) / 86400000);

    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';

    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async function loadDocuments() {
    try {
      const data = await apiFetch('/documents');
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const ok = await ensureSession();
      if (!active) return;
      if (!ok) {
        navigate('/login');
        return;
      }

      setIsAuthed(true);
      loadDocuments();
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function createDocument(e) {
    e.preventDefault();
    setError('');

    try {
      await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title }),
        headers: {
          'Content-Type': 'application/json', // Set JSON content type
          'Accept': 'application/json'        // Optional: tell server you expect JSON back
        },
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

  function handleDocumentDragStart(id) {
    setDraggingDocumentId(id);
  }

  function handleDocumentDragEnd() {
    setDraggingDocumentId('');
  }

  async function handleDocumentDrop(targetId, placement) {
    if (!draggingDocumentId || draggingDocumentId === targetId) {
      setDraggingDocumentId('');
      return;
    }

    const current = [...sortedDocuments];
    const from = current.findIndex((item) => item.id === draggingDocumentId);
    const to = current.findIndex((item) => item.id === targetId);

    if (from < 0 || to < 0) {
      setDraggingDocumentId('');
      return;
    }

    const [moved] = current.splice(from, 1);
    const insertAt = placement === 'before' ? to : to + 1;
    current.splice(insertAt > from ? insertAt - 1 : insertAt, 0, moved);

    setDocuments(current);
    setDraggingDocumentId('');

    const newIndex = current.findIndex((item) => item.id === moved.id);
    const previous = newIndex > 0 ? current[newIndex - 1] : null;
    const next = newIndex < current.length - 1 ? current[newIndex + 1] : null;

    try {
      const updated = await reorderDocument({
        documentId: moved.id,
        previousDocumentId: previous?.id || null,
        nextDocumentId: next?.id || null
      });

      setDocuments((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                order_index: updated.order_index,
                updated_at: updated.updated_at
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || 'Could not reorder document');
      await loadDocuments();
    }
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

  async function goToEditor() {
    setError('');

    try {
      if (sortedDocuments.length > 0) {
        navigate(`/dashboard/${sortedDocuments[0].id}`);
        return;
      }

      const created = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled' })
      });
      navigate(`/dashboard/${created.id}`);
    } catch (err) {
      setError(err.message || 'Could not open editor');
    }
  }

  async function logout() {
    await logoutSession();
    navigate('/login');
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <main className="bn-page">
      <div className="bn-stage" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>Dashboard</h1>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Create and manage your private documents.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={goToEditor}
              style={{
                borderRadius: '0.75rem',
                border: '1px solid #d4d4d8',
                backgroundColor: '#fff',
                color: '#4b5563',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
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
              Editor
            </button>
            <button
              onClick={logout}
              style={{
                borderRadius: '0.75rem',
                border: '1px solid #d4d4d8',
                backgroundColor: '#fff',
                color: '#4b5563',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
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
              Logout
            </button>
          </div>
        </header>

        <form onSubmit={createDocument} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.9rem', padding: '1rem' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Document title"
            style={{
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              padding: '0.75rem 1rem',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            style={{
              borderRadius: '0.75rem',
              backgroundColor: '#8b5cf6',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
          >
            Create
          </button>
        </form>

        <div style={{ marginBottom: '1rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.9rem', padding: '1rem' }}>
          <label htmlFor="document-search" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Search documents by title
          </label>
          <input
            id="document-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a document title..."
            style={{
              width: '100%',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              padding: '0.75rem 1rem',
              fontSize: '0.95rem'
            }}
          />
        </div>

        {error && <p style={{ marginBottom: '1rem', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#be123c', fontSize: '0.85rem' }}>{error}</p>}

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <ul style={{ display: 'grid', gap: '0.75rem', overflowY: 'auto', minHeight: 0, paddingRight: '0.25rem' }}>
            {filteredDocuments.map((doc) => (
              <li
                key={doc.id}
                draggable={editingId !== doc.id}
                onDragStart={() => handleDocumentDragStart(doc.id)}
                onDragEnd={handleDocumentDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                  handleDocumentDrop(doc.id, placement);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  padding: '1rem',
                  gap: '1rem',
                  cursor: editingId === doc.id ? 'default' : 'grab',
                  opacity: draggingDocumentId === doc.id ? 0.65 : 1,
                }}
              >
              {editingId === doc.id ? (
                <div style={{ display: 'grid', width: '100%', gap: '0.75rem', gridTemplateColumns: '1fr auto' }}>
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      color: '#1f2937',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.9rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => saveRename(doc.id)}
                      style={{
                        borderRadius: '0.5rem',
                        backgroundColor: '#8b5cf6',
                        color: '#fff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      style={{
                        borderRadius: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb';
                        e.target.style.borderColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{doc.title || 'Untitled'}</p>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{getDocumentDateLabel(doc.updated_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/dashboard/${doc.id}`}
                      style={{
                        borderRadius: '0.5rem',
                        border: '1px solid #86efac',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dcfce7'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f0fdf4'}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => startRename(doc)}
                      style={{
                        borderRadius: '0.5rem',
                        border: '1px solid #93c5fd',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#bfdbfe'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#eff6ff'}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      style={{
                        borderRadius: '0.5rem',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              </li>
            ))}
          </ul>
        </div>

        {!documents.length && (
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>No documents yet. Create your first one above.</p>
        )}

        {documents.length > 0 && filteredDocuments.length === 0 && (
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>No documents match your search.</p>
        )}
      </div>
    </main>
  );
}
