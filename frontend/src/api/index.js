// ===== Centralized API Configuration =====
// Change BASE_URL here when deploying to production.
// In development, Vite proxy handles /api -> localhost:5000

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Core fetch wrapper ──
const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  return response;
};

// ── Helper to build auth headers ──
const authHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

const jsonAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ===== Auth APIs =====
export const authAPI = {
  login: (email, password) =>
    apiFetch('/api/v2/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  register: (username, email, password) =>
    apiFetch('/api/v2/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    }),

  updateProfile: (token, { username, profilePicture }) =>
    apiFetch('/api/v2/auth/profile', {
      method: 'PUT',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ username, profilePicture }),
    }),
};

// ===== Runs APIs =====
export const runsAPI = {
  getAll: (token) =>
    apiFetch('/api/v2/runs', {
      headers: authHeaders(token),
    }),

  start: (token, { lat, lng }) =>
    apiFetch('/api/v2/runs/start', {
      method: 'POST',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ lat, lng }),
    }),

  updateLocation: (token, runId, { lat, lng }) =>
    apiFetch(`/api/v2/runs/${runId}/location`, {
      method: 'PATCH',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ lat, lng }),
    }),

  end: (token, runId) =>
    apiFetch(`/api/v2/runs/${runId}/end`, {
      method: 'PATCH',
      headers: jsonAuthHeaders(token),
    }),

  delete: (token, runId) =>
    apiFetch(`/api/v2/runs/${runId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
};

// ===== Stats APIs =====
export const statsAPI = {
  getRunStats: (token) =>
    apiFetch('/api/v2/stats/runs', {
      headers: authHeaders(token),
    }),

  getGamification: (token) =>
    apiFetch('/api/v2/stats/gamification', {
      headers: authHeaders(token),
    }),

  getGlobalLeaderboard: (token) =>
    apiFetch('/api/v2/stats/leaderboard/global', {
      headers: authHeaders(token),
    }),
};

// ===== Territory APIs =====
export const territoryAPI = {
  getAll: (token) =>
    apiFetch('/api/v2/territories', {
      headers: authHeaders(token),
    }),

  getMine: (token) =>
    apiFetch('/api/v2/territories/mine', {
      headers: authHeaders(token),
    }),
};

// ===== Clan APIs =====
export const clanAPI = {
  getAll: (token) =>
    apiFetch('/api/v2/clans', {
      headers: authHeaders(token),
    }),

  create: (token, { name, description }) =>
    apiFetch('/api/v2/clans', {
      method: 'POST',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ name, description }),
    }),

  join: (token, clanId) =>
    apiFetch(`/api/clans/${clanId}/join`, {
      method: 'POST',
      headers: authHeaders(token),
    }),
};
