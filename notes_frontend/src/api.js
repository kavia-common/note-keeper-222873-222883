const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

// parse server error payload gracefully
async function parseError(res) {
  try {
    const data = await res.json();
    const detail = data?.detail || data?.message || (typeof data === 'string' ? data : '');
    return detail || res.statusText || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, mode: 'cors' });

  if (res.status === 204) {
    return null;
  }
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }
  // If there is no content-type json, try text
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  // Auth
  // PUBLIC_INTERFACE
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    });
    if (data && data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },
  // PUBLIC_INTERFACE
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
      // small delay to allow backend to finalize logout before clearing token
      await new Promise((r) => setTimeout(r, 50));
    } catch {
      // ignore network/logout endpoint errors; still clear token
    } finally {
      setToken('');
    }
  },
  // Notes
  // PUBLIC_INTERFACE
  listNotes() {
    return request('/notes', { method: 'GET' });
  },
  // PUBLIC_INTERFACE
  createNote(title, content) {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  },
  // PUBLIC_INTERFACE
  getNote(id) {
    return request(`/notes/${id}`, { method: 'GET' });
  },
  // PUBLIC_INTERFACE
  updateNote(id, fields) {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
  },
  // PUBLIC_INTERFACE
  deleteNote(id) {
    return request(`/notes/${id}`, { method: 'DELETE' });
  },
  getToken,
  setToken,
};
