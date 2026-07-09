// Mesmas rotas em dev (Vite) e produção (Apache reescreve para .php)
export const ENDPOINTS = {
  session: 'api/auth/session',
  login: 'api/auth/login',
  logout: 'api/auth/logout',
  save: 'api/bio/save',
  upload: 'api/assets/upload',
  listAssets: 'api/assets/list',
  deleteAsset: 'api/assets/delete',
} as const
