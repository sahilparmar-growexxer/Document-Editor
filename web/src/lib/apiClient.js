const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
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
