import axios from 'axios';
import type {
  AuthResponse,
  ClientAdminDetails,
  ClientSummary,
  CurrentUserProfile,
  DashboardData,
  Conteneur,
  ConteneurDetailResult,
  Sortie,
  Alerte,
  PagedResult,
  SyncStatus,
  JournalSync,
  PortalStats,
  Facture,
  FactureDetail,
  PortalUser,
  Reclamation,
  ReclamationAuditEntry,
  CreateReclamationPayload,
  UpdateReclamationPayload,
  SimulateurResponse,
  AcquitInfo,
  ConteneurSimuInfo,
  HdConteneurRow,
  HdSimulateurResponse,
} from '../types';

// Auth via HttpOnly cookie (withCredentials: true) — no Bearer header needed
const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/';
    }
    if (
      error.response?.status === 403 &&
      (error.response?.data?.mustChangePwd || !window.location.pathname.startsWith('/change-password'))
    ) {
      if (error.response?.data?.mustChangePwd) {
        window.location.href = '/change-password';
      }
    }
    return Promise.reject(error);
  },
);

export const login = (loginVal: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { login: loginVal, password }).then(r => r.data);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post<{ message: string; token: string; expiresAt: string }>('/auth/change-password', { currentPassword, newPassword }).then(r => r.data);

export const logout = () => api.post('/auth/logout');

export const getMyProfile = () =>
  api.get<CurrentUserProfile>('/auth/me').then(r => r.data);

// ── Client Discovery ──
export const getClients = (page = 1, size = 20, search?: string) =>
  api
    .get<PagedResult<ClientSummary>>('/admin/clients', {
      params: {
        page,
        pageSize: size,
        search: search || undefined,
      },
    })
    .then(r => r.data);

export const getClientDetails = (clientCode: string) =>
  api.get<ClientAdminDetails>(`/admin/clients/${clientCode}`).then(r => r.data);

// ── Dashboard ──
export const getDashboard = (clientCode: string) =>
  api.get<DashboardData>('/dashboard', { params: { clientCode } }).then(r => r.data);

// ── Stock ──
export const getStock = (
  clientCode: string,
  page = 1,
  size = 20,
  site?: string,
  statut?: string,
  q?: string,
  dateFrom?: string,
  dateTo?: string,
  bad?: string,
  port?: string,
  activite?: string,
  acquit?: string,
  pesage?: boolean,
  visiteCode?: number,
  sortBy?: string,
  sortDir?: string,
) =>
  api
    .get<PagedResult<Conteneur>>(`/stock/${clientCode}`, {
      params: {
        page, size,
        site: site || undefined,
        statut: statut || undefined,
        q: q || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        bad: bad || undefined,
        port: port || undefined,
        activite: activite || undefined,
        acquit: acquit || undefined,
        pesage: pesage ?? undefined,
        visiteCode: visiteCode ?? undefined,
        sortBy: sortBy || undefined,
        sortDir: sortDir || undefined,
      },
    })
    .then(r => r.data);

export const exportStockAll = (
  clientCode: string,
  site?: string,
  q?: string,
  dateFrom?: string,
  dateTo?: string,
  bad?: string,
  port?: string,
  activite?: string,
  acquit?: string,
) =>
  api
    .get<Conteneur[]>(`/stock/${clientCode}/export`, {
      params: {
        site: site || undefined,
        q: q || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        bad: bad || undefined,
        port: port || undefined,
        activite: activite || undefined,
        acquit: acquit || undefined,
      },
    })
    .then(r => r.data);

// ── Sites / Activités (for dynamic filter dropdowns) ──
export const getSites = (clientCode: string) =>
  api.get<string[]>(`/stock/${clientCode}/sites`).then(r => r.data);

export const getActivitesStock = (clientCode: string) =>
  api.get<string[]>(`/stock/${clientCode}/activites`).then(r => r.data);

export const getEntreesJour = (clientCode: string) =>
  api.get<{ aujourdhui: number; cetteSemaine: number }>(`/stock/${clientCode}/entrees-jour`).then(r => r.data);

export const getActivitesSorties = (clientCode?: string) =>
  api.get<string[]>('/sorties/activites', { params: { clientCode: clientCode || undefined } }).then(r => r.data);

// ── Container Detail ──
export const getConteneurDetail = (numero: string) =>
  api.get<ConteneurDetailResult>(`/conteneurs/${numero}`).then(r => r.data);

// ── Sorties ──
export const getSorties = (
  page = 1,
  size = 20,
  clientCode?: string,
  conteneur?: string,
  site?: string,
  dateFrom?: string,
  dateTo?: string,
  activite?: string,
  acquit?: string,
) =>
  api
    .get<PagedResult<Sortie>>('/sorties', {
      params: {
        page,
        size,
        clientCode: clientCode || undefined,
        conteneur: conteneur || undefined,
        site: site || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        activite: activite || undefined,
        acquit: acquit || undefined,
      },
    })
    .then(r => r.data);

export const exportSortiesAll = (
  clientCode?: string,
  conteneur?: string,
  site?: string,
  dateFrom?: string,
  dateTo?: string,
  activite?: string,
  acquit?: string,
) =>
  api
    .get<Sortie[]>('/sorties/export', {
      params: {
        clientCode: clientCode || undefined,
        conteneur: conteneur || undefined,
        site: site || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        activite: activite || undefined,
        acquit: acquit || undefined,
      },
    })
    .then(r => r.data);

// ── Alertes ──
export const getAlertes = (clientCode: string, includeRead = false, page = 1, pageSize = 20) =>
  api.get<PagedResult<Alerte>>('/alertes', { params: { clientCode, includeRead: includeRead || undefined, page, pageSize } }).then(r => r.data);

export const markAlerteRead = (id: number) =>
  api.put(`/alertes/${id}/read`);

// ── Search ──
export const searchConteneurs = (params: {
  conteneur?: string;
  bad?: string;
  acquit?: string;
  connaissement?: string;
}) =>
  api.get<Conteneur[]>('/search', { params }).then(r => r.data);

export const exportSearchConteneurs = (params: {
  conteneur?: string;
  bad?: string;
  acquit?: string;
  connaissement?: string;
}) =>
  api.get<Conteneur[]>('/search/export', { params }).then(r => r.data);

// ── Documents PDF ──
// Returns a path string (for building filenames etc.) but should NOT be used with window.open
// as the endpoints require JWT. Use downloadPdf() instead.
export const getDocumentPath = (type: 'bad' | 'blc' | 'bon-sortie' | 'etat-stock', id: string | number) =>
  `/documents/${type}/${id}`;

/**
 * Downloads a PDF through the authenticated axios instance.
 * Avoids the window.open() 401 problem with Bearer-protected endpoints.
 */
export const downloadPdf = async (apiPath: string, filename: string): Promise<void> => {
  const resp = await api.get(apiPath, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ── Factures ──
export const getFactures = (
  clientCode: string,
  page = 1,
  size = 20,
  statut?: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string,
  acquit?: string,
) =>
  api
    .get<PagedResult<Facture>>('/factures', {
      params: {
        clientCode,
        page, size,
        statut: statut || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        acquit: acquit || undefined,
      },
    })
    .then(r => r.data);

export const getFactureDetail = (id: number) =>
  api.get<FactureDetail>(`/factures/${id}`).then(r => r.data);

export const getFacturePdfPath = (id: number) => `/factures/${id}/pdf`;

// ── Admin ──
export const getSyncStatus = () =>
  api.get<SyncStatus[]>('/admin/sync-status').then(r => r.data);

export const forceSyncEntity = (entity: string) =>
  api.post<{ message: string }>(`/admin/sync/force/${entity}`).then(r => r.data);

export const getJournal = (limit = 50) =>
  api.get<JournalSync[]>('/admin/journal', { params: { limit } }).then(r => r.data);

export const getPortalStats = () =>
  api.get<PortalStats>('/admin/portal-stats').then(r => r.data);

export const getUsers = (page = 1, size = 20, search?: string) =>
  api
    .get<PagedResult<PortalUser>>('/admin/users', {
      params: {
        page,
        pageSize: size,
        search: search || undefined,
      },
    })
    .then(r => r.data);

export const createUser = (loginVal: string, role: string, clientCode?: string) =>
  api.post<{ temporaryPassword: string }>('/admin/users', { clientCode: clientCode || null, login: loginVal, role }).then(r => r.data);

export const deletePortalUser = (clientCode: string) =>
  api.delete(`/admin/users/${clientCode}`).then(r => r.data);

export const resetUserPassword = (clientCode: string) =>
  api.put<{ temporaryPassword: string }>(`/admin/users/${clientCode}/reset-password`).then(r => r.data);

export const toggleUser = (clientCode: string, active: boolean) =>
  api.put(`/admin/users/${clientCode}/toggle`, null, { params: { active } }).then(r => r.data);

// ── Reclamations ──
export const getReclamations = (clientCode: string, page = 1, size = 20, statut?: string) =>
  api
    .get<PagedResult<Reclamation>>('/reclamations', {
      params: { clientCode, page, size, statut: statut || undefined },
    })
    .then(r => r.data);

export const createReclamation = (payload: CreateReclamationPayload) =>
  api.post<Reclamation>('/reclamations', payload).then(r => r.data);

export const getReclamationDetail = (id: number) =>
  api.get<Reclamation>(`/reclamations/${id}`).then(r => r.data);

export const updateReclamation = (id: number, payload: UpdateReclamationPayload) =>
  api.put(`/reclamations/${id}`, payload);

export const getReclamationAudit = (id: number) =>
  api.get<ReclamationAuditEntry[]>(`/reclamations/${id}/audit`).then(r => r.data);

export const getAllReclamations = (page = 1, size = 20, statut?: string, categorie?: string, search?: string) =>
  api
    .get<PagedResult<Reclamation>>('/admin/reclamations', {
      params: { page, size, statut: statut || undefined, categorie: categorie || undefined, search: search || undefined },
    })
    .then(r => r.data);

// For agents: calls /reclamations without clientCode — server detects Agent role and returns all
export const getAgentReclamations = (page = 1, size = 20, statut?: string, search?: string) =>
  api
    .get<PagedResult<Reclamation>>('/reclamations', {
      params: { page, size, statut: statut || undefined, search: search || undefined },
    })
    .then(r => r.data);


export const getSimulateurAcquits = (clientCode: string) =>
  api.get<AcquitInfo[]>(`/simulateur/${clientCode}/acquits`).then(r => r.data);

export const getSimulateurConteneurs = (clientCode: string, acquit: string) =>
  api.get<ConteneurSimuInfo[]>(`/simulateur/${clientCode}/conteneurs`, { params: { acquit } }).then(r => r.data);

export const runSimulateur = (
  clientCode: string,
  dateSortieEstimee: string,
  numeroAcquit: string,
  conteneurs: string[],
) =>
  api
    .post<SimulateurResponse>(`/simulateur/${clientCode}`, {
      dateSortieEstimee,
      numeroAcquit,
      conteneurs,
    })
    .then(r => r.data);

export const getHdConteneurs = (clientCode: string) =>
  api.get<HdConteneurRow[]>(`/simulateur-hd/${clientCode}/conteneurs`).then(r => r.data);

export const simulerHd = (
  clientCode: string,
  dateSortieEstimee: string,
  conteneurs: string[],
) =>
  api
    .post<HdSimulateurResponse>(`/simulateur-hd/${clientCode}`, { dateSortieEstimee, conteneurs })
    .then(r => r.data);

export const downloadFactureSimulee = async (
  clientCode: string,
  dateSortieEstimee: string,
  numeroAcquit: string,
  conteneurs: string[],
): Promise<void> => {
  const response = await api.post(
    `/simulateur/${clientCode}/pdf`,
    { dateSortieEstimee, numeroAcquit, conteneurs },
    { responseType: 'blob' },
  );
  const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href  = url;
  link.download = `Facture_Simulee_${clientCode}_${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadFactureSimuleeHd = async (
  clientCode: string,
  dateSortieEstimee: string,
  conteneurs: string[],
): Promise<void> => {
  const response = await api.post(
    `/simulateur-hd/${clientCode}/pdf`,
    { dateSortieEstimee, conteneurs },
    { responseType: 'blob' },
  );
  const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href  = url;
  link.download = `Facture_Simulee_HD_${clientCode}_${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
