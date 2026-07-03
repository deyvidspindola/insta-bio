// Em produção (build para a HostGator) usamos arquivos PHP servidos na mesma
// pasta do editor. Em desenvolvimento (npm run admin) usamos o servidor Node.
const PROD = import.meta.env.PROD

export const ENDPOINTS = {
  session: PROD ? 'session.php' : '/api/auth/session',
  login: PROD ? 'login.php' : '/api/auth/login',
  logout: PROD ? 'logout.php' : '/api/auth/logout',
  save: PROD ? 'save.php' : '/api/bio/save',
  upload: PROD ? 'upload.php' : '/__upload',
  listAssets: PROD ? 'list-images.php' : '/api/assets/list',
  deleteAsset: PROD ? 'delete-image.php' : '/api/assets/delete',
}
