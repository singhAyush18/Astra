// ===== Centralized API Configuration =====
// Change BASE_URL here when deploying to production.
// In development, Vite proxy handles /api -> localhost:5000

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Core fetch wrapper ──
const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const finalOptions = {
    ...options,
    credentials: 'include', // Automatically send cookies
  };
  const response = await fetch(url, finalOptions);
  return response;
};

// ── Helper to build auth headers ──
// Token is now sent via HttpOnly cookie, so we don't need Authorization header
const authHeaders = (token, extra = {}) => ({
  ...extra,
});

const jsonAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
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

  verifyEmail: (token) =>
    apiFetch(`/api/v2/auth/verify-email?token=${token}`),

  resendVerification: (email) =>
    apiFetch('/api/v2/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  forgotPassword: (email) =>
    apiFetch('/api/v2/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, newPassword) =>
    apiFetch('/api/v2/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    }),
  requestPasswordChangeOtp: (token, currentPassword) =>
    apiFetch('/api/v2/auth/change-password/request-otp', {
      method: 'POST',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ currentPassword }),
    }),
  changePassword: (token, { currentPassword, newPassword, otpCode }) =>
    apiFetch('/api/v2/auth/change-password', {
      method: 'PUT',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword, otpCode }),
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

  updateLocation: (token, runId, { lat, lng, duration }) =>
    apiFetch(`/api/v2/runs/${runId}/location`, {
      method: 'PATCH',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ lat, lng, duration }),
    }),

  end: (token, runId, options = {}) => {
    const payload = typeof options === 'number' ? { duration: options } : options;
    return apiFetch(`/api/v2/runs/${runId}/end`, {
      method: 'PATCH',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  delete: (token, runId) =>
    apiFetch(`/api/v2/runs/${runId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  generateDebrief: (token, runId) =>
    apiFetch(`/api/v2/runs/${runId}/debrief`, {
      method: 'POST',
      headers: jsonAuthHeaders(token),
    }),
};

// ===== Agents APIs =====
export const agentsAPI = {
  getStatus: () =>
    apiFetch('/api/v2/agents/status'),

  getCoachDebrief: (token, telemetry) =>
    apiFetch('/api/v2/agents/coach-debrief', {
      method: 'POST',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify(telemetry),
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
    apiFetch('/api/v2/territories/my', {
      headers: authHeaders(token),
    }),

  getMyProgress: (token) =>
    apiFetch('/api/v2/territories/my-progress', {
      headers: authHeaders(token),
    }),

  nameTerritory: (token, territoryId, name) =>
    apiFetch(`/api/v2/territories/${territoryId}/name`, {
      method: 'PUT',
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ name }),
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
    apiFetch(`/api/v2/clans/${clanId}/join`, {
      method: 'POST',
      headers: authHeaders(token),
    }),
};
