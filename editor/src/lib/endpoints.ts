// Mesmas rotas em dev (Vite) e produção (Apache reescreve para .php)
export const ENDPOINTS = {
  session: 'api/auth/session',
  platformConfig: 'api/auth/platform-config',
  login: 'api/auth/login',
  establish: 'api/auth/establish',
  logout: 'api/auth/logout',
  load: 'api/bio/load',
  save: 'api/bio/save',
  publish: 'api/bio/publish',
  revert: 'api/bio/revert',
  paths: 'api/bio/paths',
  upload: 'api/assets/upload',
  listAssets: 'api/assets/list',
  deleteAsset: 'api/assets/delete',
  updateStatus: 'api/update/status',
  updateCheck: 'api/update/check',
  updateApply: 'api/update/apply',
} as const
