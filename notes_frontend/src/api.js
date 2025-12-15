const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (res.status === 204) {
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false
    });
    setToken(data.access_token);
    return data;
  },
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setToken('');
    }
  },
  // Notes
  listNotes() {
    return request('/notes', { method: 'GET' });
  },
  createNote(title, content) {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });
  },
  getNote(id) {
    return request(`/notes/${id}`, { method: 'GET' });
  },
  updateNote(id, fields) {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields)
    });
  },
  deleteNote(id) {
    return request(`/notes/${id}`, { method: 'DELETE' });
  },
  getToken, setToken
}
