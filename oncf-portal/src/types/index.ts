// ── API Response Types (matching C# DTOs) ──

export interface ClientSummary {
  clientCode: string;
  nomClient: string;
  totalConteneurs: number;
  enStock: number;
  premierEntree: string | null;
  dernierEntree: string | null;
}

export interface ClientAdminDetails {
  clientCode: string;
  nomClient: string;
  adresse: string | null;
  ville: string | null;
  estActif: boolean;
  totalConteneurs: number;
  enStock: number;
  premierEntree: string | null;
  dernierEntree: string | null;
  portalLogin: string | null;
  portalIsActive: boolean;
  portalMustChangePwd: boolean;
  portalCreatedAt: string | null;
  portalLastLogin: string | null;
  hasPortalAccount: boolean;
}

export interface DashboardData {
  totalEnStock: number;
  totalConteneurs: number;
  alertesNonLues: number;
  sortiesRecentes: number;
  parSite: SiteStock[];
  topAnciens: TopAncien[];
  tendance: Tendance[];
}

export interface TopAncien {
  numeroConteneur: string;
  siteLibelle: string;
  dateEntree: string;
  nombreJoursStockage: number;
}

export interface Tendance {
  semaine: string;
  entrees: number;
  sorties: number;
}

export interface SiteStock {
  siteLibelle: string;
  ville: string;
  quantite: number;
}

export interface Conteneur {
  numeroConteneur: string;
  clientCode: string;
  siteCode: string;
  siteLibelle: string;
  ville: string;
  dateEntree: string;
  dateSortie: string | null;
  statutLogistique: string;
  typeConteneur: string;
  tailleConteneur: string;
  numeroBAD: string | null;
  typeActivite: string | null;
  typeStockage: string | null;
  portChargement: string | null;
  sourceEntreeId: string | null;
  lastSync: string | null;
  nombreJoursStockage: number;
  numeroAcquitement: string | null;
  moyenTransport: string | null;
  hasPesage: boolean;
  typeVisite: string | null;
}

export interface ConteneurDetail {
  numeroDemande: string | null;
  declarationSommaire: string | null;
  numeroAcquitement: string | null;
  dateAcquit: string | null;
  navire: string | null;
  portArrive: string | null;
  portOrigine: string | null;
  numeroConnaissement: string | null;
  destinataire: string | null;
  poidsBrut: number | null;
  poidsTare: number | null;
  natureMarchandise: string | null;
  codeTAR: string | null;
  donneurOrdre: string | null;
  clientFinal: string | null;
}

export interface Sortie {
  id: number;
  numeroConteneur: string;
  numDemandeSortie: string | null;
  numBLC: string | null;
  numBonSortie: string | null;
  dateSortie: string | null;
  dateDemande: string | null;
  moyenTransport: string | null;
  activite: string | null;
  libelleTransitaire: string | null;
  libelleClient: string | null;
  etatConteneur: string | null;
  numeroAcquitement: string | null;
}

export interface Mouvement {
  mouvementId: number;
  numeroConteneur: string;
  typeMouvement: string;
  description: string;
  dateMouvement: string;
  source: string | null;
}

export interface Alerte {
  alerteId: number;
  numeroConteneur: string;
  clientCode: string;
  typeAlerte: string;
  niveauAlerte: string;
  titre: string;
  message: string | null;
  estLue: boolean;
  dateAlerte: string;
  dateLecture: string | null;
}

export interface FactureLiee {
  factureId: number;
  numeroFacture: string;
  typeFacture: string | null;
  statut: string;             // 'PREVALIDEE' | 'VALIDEE'
  dateValidation: string | null;
  dateDebutPeriode: string | null;
  dateFinPeriode: string | null;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

export interface ConteneurOperation {
  prestationCode: number;
  facturable: boolean;
  operationDate: string | null;
  clientCode: string | null;
}

export interface ConteneurDetailResult {
  conteneur: Conteneur;
  detail: ConteneurDetail | null;
  sorties: Sortie[];
  mouvements: Mouvement[];
  facturesLiees: FactureLiee[];
  operations: ConteneurOperation[];
}

export interface AcquitInfo {
  numeroAcquit: string;
  nbConteneurs: number;
  premierEntree: string | null;
  numeroConnaissement: string | null;
}

export interface ConteneurSimuInfo {
  numeroConteneur: string;
  typeConteneur: string | null;
  tailleConteneur: string | null;
  dateEntree: string;
  siteLibelle: string | null;
  nombreJours: number;
  numeroConnaissement: string | null;
}

export interface SimulateurTranche {
  designation: string;
  nombreJours: number;
  prixUnitaire: number;
  montantHT: number;
  montantTTC: number;
}

export interface SimulateurConteneur {
  numeroConteneur: string;
  typeConteneur: string;
  tailleConteneur: string;
  typeTC: string;
  dateEntree: string;
  nombreJours: number;
  numeroAcquit: string | null;
  donneurOrdre: string | null;
  tranches: SimulateurTranche[];
  montantHT: number;
  montantTTC: number;
}

export interface SimulateurTotaux {
  nombreConteneurs: number;
  nombreConteneurs20: number;
  nombreConteneurs40: number;
  nombreUnites: number;
  nombreAcquits: number;
  totalMagasinage_HT: number;
  totalMagasinage_TTC: number;
  fraisManutention_HT: number;
  fraisManutention_TauxTVA: number;
  fraisManutentionAPM_HT: number;
  fraisOperationDoc_HT: number;
  fraisOperationDoc_TauxTVA: number;
  fraisScelle_HT: number;
  fraisScelle_NbTC: number;
  fraisRedevanceInfo_HT: number;
  fraisCamionnage_HT: number;
  fraisCamionnage_TauxTVA: number;
  fraisCamionnage_NbAcquits: number;
  totalMaersk_HT: number;
  fraisOperationsClientFinal_HT: number;
  fraisOperationsClientFinal_TTC: number;
  totalGeneral_HT: number;
  totalGeneral_TTC: number;
}

export interface SimulateurOperationLine {
  numeroConteneur: string;
  prestationCode: number;
  designation: string;
  nbOps: number;
  pu: number;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  isSurDevis: boolean;
}

export interface SimulateurResponse {
  clientCode: string;
  dateSimulation: string;
  dateSortieEstimee: string;
  conteneurs: SimulateurConteneur[];
  totaux: SimulateurTotaux;
  perspective?: 'ClientFinal' | 'ClientDirect' | 'DonneurOrdre' | 'DonneurOrdreFinal' | 'Admin';
  Perspective?: 'ClientFinal' | 'ClientDirect' | 'DonneurOrdre' | 'DonneurOrdreFinal' | 'Admin';
  operationsClientFinal: SimulateurOperationLine[];
  OperationsClientFinal?: SimulateurOperationLine[];
}

export interface PagedResult<T> {
  totalCount: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface SyncStatus {
  entityName: string;
  lastSuccessfulSync: string | null;
  watermarkValue: string | null;
  status: string;
  nextScheduledRun: string | null;
  lastAttempt: string | null;
  lastError: string | null;
}

export interface JournalSync {
  journalId: number;
  nomJob: string;
  dateDebut: string;
  dateFin: string;
  nbTraites: number;
  statut: string;
  messageErreur: string | null;
}

export interface PortalStats {
  totalConteneurs: number;
  enStockCount: number;
  totalFactures: number;
  totalClients: number;
  totalUsersActifs: number;
  reclamationsOuvertes: number;
}

export interface Facture {
  factureId: number;
  sourceFactureId: number;
  clientCode: string;
  numeroFacture: string;
  typeFacture: string | null;
  estManuelle: boolean;
  dateDebutPeriode: string | null;
  dateFinPeriode: string | null;
  statut: 'PREVALIDEE' | 'VALIDEE' | 'ANNULEE';
  dateValidation: string | null;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  conteneurs: string | null;
  numAcquits: string | null;
  connaissements: string | null;
  trains: string | null;
  ice: string | null;
  telephoneClient: string | null;
  dateMajSource: string;
}

export interface LigneFacture {
  ligneId: number;
  sourceFactureId: number;
  numLigne: number;
  designation: string;
  nbreTC: number;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  codePrestation: string | null;
}

export interface ConteneurLie {
  numeroConteneur: string;
  sourceOperationId: number | null;
  clientCode: string | null;
  siteLibelle: string | null;
  ville: string | null;
  dateEntree: string | null;
  dateSortie: string | null;
  statutConteneur: string | null;  // 'EN_STOCK' | 'SORTI' | null (not in portal)
}

export interface FactureDetail {
  facture: Facture;
  lignes: LigneFacture[];
  factureParent: Facture | null;
  conteneursLies: ConteneurLie[];
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  clientCode: string;
  nomClient: string;
  isAdmin: boolean;
  isAgent: boolean;
  mustChangePwd: boolean;
  expiresAt: string;
}

export interface PortalUser {
  id: number;
  clientCode: string | null;
  login: string;
  nomClient: string | null;
  isAdmin: boolean;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  mustChangePwd: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  totalConteneurs: number;
  enStock: number;
}

export interface CurrentUserProfile {
  id: number;
  login: string;
  clientCode: string | null;
  nomClient: string;
  isAdmin: boolean;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  mustChangePwd: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  createdBy: string | null;
  totalConteneurs: number;
  enStock: number;
}

export interface ReclamationAuditEntry {
  auditId: number;
  oldStatut: string | null;
  newStatut: string;
  changedByLogin: string;
  changedAt: string;
  note: string | null;
}

export interface Reclamation {
  id: number;
  numeroReference: string;
  clientCode: string;
  categorie:
    | 'RETARD_CHARGEMENT_TC'
    | 'RETARD_ACHEMINEMENT'
    | 'RETARD_ENVOI_BAD'
    | 'TC_ENDOMMAGE'
    | 'CONTESTATION_FACTURE'
    | 'INDISPO_ENGIN'
    | 'ERREUR_MONTANT_FACTURE'
    | 'COMPORTEMENT_PERSONNEL'
    | 'RETARD_OPERATIONS'
    | 'AUTRE';
  objet: string;
  description: string;
  numeroConteneur?: string;
  numeroFacture?: string;
  telephoneContact?: string;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' | 'FERMEE';
  dateCreation: string;
  dateMaj: string;
  reponseAdmin?: string;
  dateReponse?: string;
  assignedToLogin?: string | null;
  assignedAt?: string | null;
  audit?: ReclamationAuditEntry[];
  totalCount?: number;
}

export interface CreateReclamationPayload {
  clientCode: string;
  categorie: string;
  objet: string;
  description: string;
  numeroConteneur?: string;
  numeroFacture?: string;
  telephoneContact?: string;
}

export interface UpdateReclamationPayload {
  statut: string;
  reponseAdmin?: string;
  note?: string;
}

// ── Simulateur Hors Douane ────────────────────────────────────────────────────

export interface HdConteneurRow {
  numeroConteneur: string;
  tailleConteneur: string | null;
  typeConteneur: string | null;
  dateEntree: string;
  siteLibelle: string | null;
  donneurOrdre: string | null;
  clientFinal: string | null;
}

export interface HdTranche {
  designation: string;
  nombreJours: number;
  prixUnitaire: number;
  montantHT: number;
}

export interface HdConteneurResult {
  numeroConteneur: string;
  typeTC: string;
  siteLibelle: string | null;
  dateEntree: string;
  nombreJours: number;
  joursFacturables: number;
  tranches: HdTranche[];
  magasinageHT: number;
  manutentionHT: number;
  totalHT: number;
  totalTTC: number;
}

export interface HdTotaux {
  nombreConteneurs: number;
  nombreConteneurs20: number;
  nombreConteneurs40: number;
  totalMagasinage_HT: number;
  totalMagasinage_TTC: number;
  totalManutention_HT: number;
  totalGeneral_HT: number;
  totalGeneral_TTC: number;
}

export interface HdSimulateurResponse {
  clientCode: string;
  dateSimulation: string;
  dateSortieEstimee: string;
  hasConfig: boolean;
  franchiseJours: number;
  billingCas: 1 | 2;
  conteneurs: HdConteneurResult[];
  totaux: HdTotaux;
  maerskManutention_HT?: number;
  maerskManutention_TTC?: number;
  nbConteneursMaersk?: number;
}
