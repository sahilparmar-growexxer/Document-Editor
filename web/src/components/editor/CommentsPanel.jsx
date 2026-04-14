import { useEffect, useState } from 'react';
import {
  createDocumentComment,
  deleteComment,
  listDocumentComments,
  updateCommentResolved
} from '../../lib/apiClient';

function formatRelative(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommentsPanel({ documentId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    setLoading(true);
    setError('');
    try {
      const rows = await listDocumentComments(documentId);
      setItems(rows);
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!documentId) return;
    loadComments();
  }, [documentId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setSubmitting(true);
    setError('');
    try {
      const created = await createDocumentComment(documentId, body);
      setItems((prev) => [{ ...created, author_email: 'you' }, ...prev]);
      setDraft('');
    } catch (err) {
      setError(err.message || 'Could not create comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(commentId, resolved) {
    try {
      const updated = await updateCommentResolved(commentId, resolved);
      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, resolved: updated.resolved } : item
        )
      );
    } catch (err) {
      setError(err.message || 'Could not update comment');
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(commentId);
      setItems((prev) => prev.filter((item) => item.id !== commentId));
    } catch (err) {
      setError(err.message || 'Could not delete comment');
    }
  }

  return (
    <aside className="bn-comments-panel">
      <header className="bn-comments-head">
        <h3>Comments</h3>
      </header>

      <form className="bn-comment-compose" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Leave a comment"
        />
        <button type="submit" disabled={submitting || !draft.trim()}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {error ? <p className="bn-comment-error">{error}</p> : null}

      <div className="bn-comment-list">
        {loading ? <p className="bn-comment-empty">Loading comments...</p> : null}

        {!loading && !items.length ? (
          <p className="bn-comment-empty">No comments yet</p>
        ) : null}

        {items.map((comment) => (
          <article key={comment.id} className={`bn-comment-card ${comment.resolved ? 'is-resolved' : ''}`}>
            <div className="bn-comment-meta">
              <span>{comment.author_email || 'member'}</span>
              <span>{formatRelative(comment.created_at)}</span>
            </div>

            <p>{comment.body}</p>

            <div className="bn-comment-actions">
              <button
                type="button"
                onClick={() => handleResolve(comment.id, !comment.resolved)}
              >
                {comment.resolved ? 'Re-open' : 'Resolve'}
              </button>
              <button type="button" onClick={() => handleDelete(comment.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
