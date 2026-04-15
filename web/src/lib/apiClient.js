import axios from 'axios';

const API_URL = "http://localhost:4000/" || import.meta.env.VITE_API_URL || 'https://document-editor-1-nj6y.onrender.com/';
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

let accessToken = '';
let refreshInFlight = null;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

const publicApi = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  if (accessToken) {
    nextConfig.headers = {
      ...(nextConfig.headers || {}),
      Authorization: `Bearer ${accessToken}`
    };
  }
  return nextConfig;
});

async function requestTokenRefresh() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    const nextAccessToken = response?.data?.data?.accessToken || '';
    if (!nextAccessToken) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    accessToken = nextAccessToken;
    return nextAccessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const path = originalRequest.url || '';
      if (!path.includes('/auth/login') && !path.includes('/auth/register') && !path.includes('/auth/refresh')) {
        originalRequest._retry = true;
        try {
          await requestTokenRefresh();
          return api(originalRequest);
        } catch (_refreshError) {
          accessToken = '';
        }
      }
    }

    return Promise.reject(error);
  }
);

function normalizeAxiosError(error) {
  const nextError = new Error(error?.response?.data?.error?.message || error?.message || 'Request failed');
  nextError.status = error?.response?.status;
  return nextError;
}

function toAxiosConfig(path, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  const headers = { ...(options.headers || {}) };
  const hasBody = options.body != null;

  if (hasBody) {
    const hasContentType = Object.keys(headers).some(
      (key) => key.toLowerCase() === 'content-type'
    );
    const hasAccept = Object.keys(headers).some((key) => key.toLowerCase() === 'accept');

    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (!hasAccept) {
      headers.Accept = 'application/json';
    }
  }

  return {
    url: path,
    method,
    headers,
    data: options.body,
    params: options.params
  };
}

export function getAccessToken() {
  return accessToken;
}

export function setTokens(nextAccessToken) {
  accessToken = nextAccessToken || '';
}

export function clearTokens() {
  accessToken = '';
}

export async function refreshAccessToken() {
  try {
    return await requestTokenRefresh();
  } catch (error) {
    accessToken = '';
    throw normalizeAxiosError(error);
  }
}

export async function ensureSession() {
  if (accessToken) return true;

  try {
    await refreshAccessToken();
    return true;
  } catch (_err) {
    clearTokens();
    return false;
  }
}

export async function logoutSession() {
  try {
    await api.post('/auth/logout');
  } finally {
    clearTokens();
  }
}

export async function apiFetch(path, options = {}) {
  try {
    const response = await api.request(toAxiosConfig(path, options));
    return response?.data?.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function publicApiFetch(path, options = {}) {
  try {
    const response = await publicApi.request(toAxiosConfig(path, options));
    return response?.data?.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function listBlocks(documentId) {
  return apiFetch(`/documents/${documentId}/blocks`);
}

export async function createBlock(payload) {
  return apiFetch('/blocks', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function updateBlock(blockId, payload) {
  return apiFetch(`/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function deleteBlock(blockId) {
  return apiFetch(`/blocks/${blockId}`, { method: 'DELETE' });
}

export async function splitBlock(payload) {
  return apiFetch('/blocks/split', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function reorderBlock(payload) {
  return apiFetch('/blocks/reorder', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function enableDocumentShare(documentId) {
  return apiFetch(`/documents/${documentId}/share`, { method: 'POST' });
}

export async function disableDocumentShare(documentId) {
  return apiFetch(`/documents/${documentId}/share`, { method: 'DELETE' });
}

export async function reorderDocument(payload) {
  return apiFetch('/documents/reorder', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
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
    body: JSON.stringify({ body }),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function updateCommentResolved(commentId, resolved) {
  return apiFetch(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved }),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function deleteComment(commentId) {
  return apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
}
