const PROD = import.meta.env.PROD

export const ENDPOINTS = {
  session: PROD ? 'session.php' : '/api/auth/session',
  login: PROD ? 'login.php' : '/api/auth/login',
  logout: PROD ? 'logout.php' : '/api/auth/logout',
  clients: PROD ? 'clients-list.php' : '/api/clients',
  createClient: PROD ? 'clients-create.php' : '/api/clients/create',
  updateClient: PROD ? 'clients-update.php' : '/api/clients/update',
  instagramLookup: PROD ? 'instagram-lookup.php' : '/api/instagram/lookup',
  clientStatus: PROD ? 'clients-status.php' : '/api/clients/status',
  deleteClient: PROD ? 'clients-delete.php' : '/api/clients/delete',
  clientPassword: PROD ? 'clients-password.php' : '/api/clients/password',
  resetPassword: PROD ? 'clients-reset-password.php' : '/api/clients/reset-password',
}
