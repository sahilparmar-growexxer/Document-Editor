'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearTokens, getAccessToken } from '../../lib/apiClient';

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('Untitled Document');
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
      router.push('/login');
      return;
    }
    loadDocuments();
  }, []);

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

  function logout() {
    clearTokens();
    router.push('/login');
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <form onSubmit={createDocument}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button type="submit">Create</button>
      </form>

      {error ? <p>{error}</p> : null}

      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            {doc.title || 'Untitled'}
            <button onClick={() => deleteDocument(doc.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
