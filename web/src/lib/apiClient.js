const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function buildApiUrl(path) {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const nextPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(nextPath, `${baseUrl}/`).toString();
}

export function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') || '';
}

export function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = payload?.error?.message || 'Request failed';
    throw new Error(message);
  }

  return payload?.data;
}

export async function publicApiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = payload?.error?.message || 'Request failed';
    throw new Error(message);
  }

  return payload?.data;
}

export async function listBlocks(documentId) {
  return apiFetch(`/documents/${documentId}/blocks`);
}

export async function createBlock(payload) {
  return apiFetch('/blocks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateBlock(blockId, payload) {
  return apiFetch(`/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteBlock(blockId) {
  return apiFetch(`/blocks/${blockId}`, { method: 'DELETE' });
}

export async function splitBlock(payload) {
  return apiFetch('/blocks/split', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function reorderBlock(payload) {
  return apiFetch('/blocks/reorder', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function enableDocumentShare(documentId) {
  return apiFetch(`/documents/${documentId}/share`, { method: 'POST' });
}

export async function disableDocumentShare(documentId) {
  return apiFetch(`/documents/${documentId}/share`, { method: 'DELETE' });
}

export async function getSharedDocument(token) {
  return publicApiFetch(`/share/${token}`);
}

export async function listDocumentComments(documentId) {
  return apiFetch(`/documents/${documentId}/comments`);
}

export async function createDocumentComment(documentId, body) {
  return apiFetch(`/documents/${documentId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

export async function updateCommentResolved(commentId, resolved) {
  return apiFetch(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved })
  });
}

export async function deleteComment(commentId) {
  return apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
}
