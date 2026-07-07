// Mesmas rotas em dev (Vite) e produção (Apache reescreve para .php)
const API_BASE = import.meta.env.BASE_URL

export const ENDPOINTS = {
  session: `${API_BASE}api/auth/session`,
  login: `${API_BASE}api/auth/login`,
  logout: `${API_BASE}api/auth/logout`,
  clients: `${API_BASE}api/clients`,
  createClient: `${API_BASE}api/clients/create`,
  updateClient: `${API_BASE}api/clients/update`,
  instagramLookup: `${API_BASE}api/instagram/lookup`,
  clientStatus: `${API_BASE}api/clients/status`,
  deleteClient: `${API_BASE}api/clients/delete`,
  clientPassword: `${API_BASE}api/clients/password`,
  resetPassword: `${API_BASE}api/clients/reset-password`,
  exportClient: `${API_BASE}api/clients/export`,
  syncTemplate: `${API_BASE}api/clients/sync-template`,
} as const
