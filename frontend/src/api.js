const API = '/api';

export function getToken() { return localStorage.getItem('sweety_token'); }
export function setSession(token, user) {
  localStorage.setItem('sweety_token', token);
  localStorage.setItem('sweety_user', JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem('sweety_token');
  localStorage.removeItem('sweety_user');
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('sweety_user')); } catch { return null; }
}

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}
