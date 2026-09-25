const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const {
  CLIENTS, CONTAINERS, CONTAINER_DETAILS, SORTIES, ALERTES,
  FACTURES, FACTURE_LIGNES, RECLAMATIONS, RECLAMATION_AUDIT, PORTAL_USERS,
  SYNC_STATUS, JOURNAL, rand, randInt, daysAgo,
} = require('./data');

const app = express();
const PORT = 5271;
const JWT_SECRET = 'dev-secret-not-for-production';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Comptes de test ──
// admin / admin123        -> rôle ADMIN
// agent / agent123        -> rôle AGENT
// maer001 / client123     -> client Maersk Morocco
// cmacgm1 / client123     -> client CMA CGM Maroc
// transm1 / client123     -> client Transimex SARL
// atlas01 / client123     -> client Atlas Import Export
// nouveau / temp123       -> client devant changer son mot de passe
const USERS = [
  { id: 100, login: 'admin', password: 'admin123', role: 'ADMIN', clientCode: null, nomClient: 'Administration ONCF', mustChangePwd: false },
  { id: 101, login: 'agent', password: 'agent123', role: 'AGENT', clientCode: null, nomClient: 'Agent ONCF', mustChangePwd: false },
  ...CLIENTS.map((c, i) => ({
    id: 200 + i,
    login: c.clientCode.toLowerCase(),
    password: 'client123',
    role: 'CLIENT',
    clientCode: c.clientCode,
    nomClient: c.nomClient,
    mustChangePwd: false,
  })),
  { id: 300, login: 'nouveau', password: 'temp123', role: 'CLIENT', clientCode: CLIENTS[0].clientCode, nomClient: CLIENTS[0].nomClient, mustChangePwd: true },
];

function makeToken(user) {
  return jwt.sign({ id: user.id, login: user.login, role: user.role, clientCode: user.clientCode }, JWT_SECRET, { expiresIn: '8h' });
}

function setAuthCookie(res, user) {
  const token = makeToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });
  return token;
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = USERS.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur inconnu' });
    if (user.mustChangePwd && !req.path.startsWith('/auth')) {
      return res.status(403).json({ mustChangePwd: true, message: 'Changement de mot de passe requis' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

function paginate(items, page = 1, size = 20) {
  const p = Number(page) || 1;
  const s = Number(size) || 20;
  const start = (p - 1) * s;
  return { totalCount: items.length, page: p, pageSize: s, items: items.slice(start, start + s) };
}

function effectiveClientCode(req) {
  // Un ADMIN/AGENT peut passer clientCode en query pour "impersonate"; un CLIENT est restreint au sien.
  if (req.user.role === 'CLIENT') return req.user.clientCode;
  return req.query.clientCode || req.user.clientCode;
}

// ─────────────────────────── AUTH ───────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {};
  const user = USERS.find(u => u.login === String(login || '').toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });

  setAuthCookie(res, user);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  res.json({
    token: 'stored-in-httponly-cookie',
    clientCode: user.clientCode || '',
    nomClient: user.nomClient || '',
    isAdmin: user.role === 'ADMIN',
    isAgent: user.role === 'AGENT',
    mustChangePwd: user.mustChangePwd,
    expiresAt,
  });
});

app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ message: 'Mot de passe trop court' });
  }
  req.user.password = newPassword;
  req.user.mustChangePwd = false;
  const token = setAuthCookie(res, req.user);
  res.json({ message: 'Mot de passe changé avec succès', token, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user;
  const stats = CONTAINERS.filter(c => c.clientCode === u.clientCode);
  res.json({
    id: u.id,
    login: u.login,
    clientCode: u.clientCode,
    nomClient: u.nomClient,
    isAdmin: u.role === 'ADMIN',
    role: u.role,
    mustChangePwd: u.mustChangePwd,
    isActive: true,
    lastLogin: daysAgo(0),
    createdAt: daysAgo(300),
    createdBy: 'system',
    totalConteneurs: stats.length,
    enStock: stats.filter(c => c.statutLogistique === 'EN_STOCK').length,
  });
});

// ─────────────────────────── ADMIN: CLIENTS ───────────────────────────
app.get('/api/admin/clients', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, search } = req.query;
  let list = CLIENTS.map(c => {
    const conts = CONTAINERS.filter(x => x.clientCode === c.clientCode);
    return {
      clientCode: c.clientCode,
      nomClient: c.nomClient,
      totalConteneurs: conts.length,
      enStock: conts.filter(x => x.statutLogistique === 'EN_STOCK').length,
      premierEntree: conts.length ? conts.reduce((a, b) => (a.dateEntree < b.dateEntree ? a : b)).dateEntree : null,
      dernierEntree: conts.length ? conts.reduce((a, b) => (a.dateEntree > b.dateEntree ? a : b)).dateEntree : null,
    };
  });
  if (search) list = list.filter(c => c.clientCode.toLowerCase().includes(String(search).toLowerCase()) || c.nomClient.toLowerCase().includes(String(search).toLowerCase()));
  res.json(paginate(list, page, pageSize));
});

app.get('/api/admin/clients/:clientCode', authMiddleware, (req, res) => {
  const c = CLIENTS.find(x => x.clientCode === req.params.clientCode);
  if (!c) return res.status(404).json({ message: 'Client introuvable' });
  const conts = CONTAINERS.filter(x => x.clientCode === c.clientCode);
  const u = USERS.find(x => x.clientCode === c.clientCode);
  res.json({
    clientCode: c.clientCode,
    nomClient: c.nomClient,
    adresse: '123 Zone Portuaire',
    ville: 'Casablanca',
    estActif: true,
    totalConteneurs: conts.length,
    enStock: conts.filter(x => x.statutLogistique === 'EN_STOCK').length,
    premierEntree: conts.length ? conts[0].dateEntree : null,
    dernierEntree: conts.length ? conts[conts.length - 1].dateEntree : null,
    portalLogin: u?.login || null,
    portalIsActive: true,
    portalMustChangePwd: u?.mustChangePwd || false,
    portalCreatedAt: daysAgo(200),
    portalLastLogin: daysAgo(1),
    hasPortalAccount: !!u,
  });
});

// ─────────────────────────── DASHBOARD ───────────────────────────
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const clientCode = effectiveClientCode(req);
  const conts = CONTAINERS.filter(c => c.clientCode === clientCode);
  const parSiteMap = {};
  conts.filter(c => c.statutLogistique === 'EN_STOCK').forEach(c => {
    const key = c.siteLibelle;
    parSiteMap[key] = parSiteMap[key] || { siteLibelle: c.siteLibelle, ville: c.ville, quantite: 0 };
    parSiteMap[key].quantite++;
  });
  const topAnciens = conts
    .filter(c => c.statutLogistique === 'EN_STOCK')
    .sort((a, b) => b.nombreJoursStockage - a.nombreJoursStockage)
    .slice(0, 5)
    .map(c => ({ numeroConteneur: c.numeroConteneur, siteLibelle: c.siteLibelle, dateEntree: c.dateEntree, nombreJoursStockage: c.nombreJoursStockage }));
  const tendance = Array.from({ length: 6 }, (_, i) => ({
    semaine: `S${i + 1}`,
    entrees: randInt(5, 25),
    sorties: randInt(3, 20),
  }));
  res.json({
    totalEnStock: conts.filter(c => c.statutLogistique === 'EN_STOCK').length,
    totalConteneurs: conts.length,
    alertesNonLues: ALERTES.filter(a => a.clientCode === clientCode && !a.estLue).length,
    sortiesRecentes: SORTIES.filter(s => conts.some(c => c.numeroConteneur === s.numeroConteneur)).length,
    parSite: Object.values(parSiteMap),
    topAnciens,
    tendance,
  });
});

// ─────────────────────────── STOCK ───────────────────────────
function filterStock(clientCode, q) {
  let list = CONTAINERS.filter(c => c.clientCode === clientCode);
  const { site, statut, search, dateFrom, dateTo, bad, port, activite, acquit, pesage, visiteCode } = q;
  if (site) list = list.filter(c => c.siteLibelle === site);
  if (statut) list = list.filter(c => c.statutLogistique === statut);
  if (q.q) list = list.filter(c => c.numeroConteneur.toLowerCase().includes(String(q.q).toLowerCase()));
  if (dateFrom) list = list.filter(c => c.dateEntree >= dateFrom);
  if (dateTo) list = list.filter(c => c.dateEntree <= dateTo);
  if (bad) list = list.filter(c => (c.numeroBAD || '').toLowerCase().includes(String(bad).toLowerCase()));
  if (port) list = list.filter(c => c.portChargement === port);
  if (activite) list = list.filter(c => c.typeActivite === activite);
  if (acquit) list = list.filter(c => (c.numeroAcquitement || '').toLowerCase().includes(String(acquit).toLowerCase()));
  if (pesage !== undefined) list = list.filter(c => String(c.hasPesage) === String(pesage));
  if (visiteCode) list = list.filter(c => c.typeVisite === visiteCode);
  return list;
}

app.get('/api/stock/:clientCode', authMiddleware, (req, res) => {
  const list = filterStock(req.params.clientCode, req.query);
  const { page = 1, size = 20, sortBy, sortDir } = req.query;
  if (sortBy) {
    list.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }
  res.json(paginate(list, page, size));
});

app.get('/api/stock/:clientCode/export', authMiddleware, (req, res) => {
  res.json(filterStock(req.params.clientCode, req.query));
});

app.get('/api/stock/:clientCode/sites', authMiddleware, (req, res) => {
  const sites = [...new Set(CONTAINERS.filter(c => c.clientCode === req.params.clientCode).map(c => c.siteLibelle))];
  res.json(sites);
});

app.get('/api/stock/:clientCode/activites', authMiddleware, (req, res) => {
  const acts = [...new Set(CONTAINERS.filter(c => c.clientCode === req.params.clientCode).map(c => c.typeActivite).filter(Boolean))];
  res.json(acts);
});

app.get('/api/stock/:clientCode/entrees-jour', authMiddleware, (req, res) => {
  const conts = CONTAINERS.filter(c => c.clientCode === req.params.clientCode);
  res.json({ aujourdhui: randInt(0, 5), cetteSemaine: randInt(3, 20) });
});

// ─────────────────────────── SORTIES ───────────────────────────
app.get('/api/sorties/activites', authMiddleware, (req, res) => {
  res.json([...new Set(SORTIES.map(s => s.activite).filter(Boolean))]);
});

function filterSorties(q) {
  let list = SORTIES;
  const { clientCode, conteneur, site, dateFrom, dateTo, activite, acquit } = q;
  if (clientCode) {
    const nums = new Set(CONTAINERS.filter(c => c.clientCode === clientCode).map(c => c.numeroConteneur));
    list = list.filter(s => nums.has(s.numeroConteneur));
  }
  if (conteneur) list = list.filter(s => s.numeroConteneur.toLowerCase().includes(String(conteneur).toLowerCase()));
  if (dateFrom) list = list.filter(s => (s.dateSortie || '') >= dateFrom);
  if (dateTo) list = list.filter(s => (s.dateSortie || '') <= dateTo);
  if (activite) list = list.filter(s => s.activite === activite);
  if (acquit) list = list.filter(s => (s.numeroAcquitement || '').toLowerCase().includes(String(acquit).toLowerCase()));
  return list;
}

app.get('/api/sorties', authMiddleware, (req, res) => {
  const { page = 1, size = 20 } = req.query;
  res.json(paginate(filterSorties(req.query), page, size));
});

app.get('/api/sorties/export', authMiddleware, (req, res) => {
  res.json(filterSorties(req.query));
});

// ─────────────────────────── CONTENEUR DETAIL ───────────────────────────
app.get('/api/conteneurs/:numero', authMiddleware, (req, res) => {
  const c = CONTAINERS.find(x => x.numeroConteneur === req.params.numero);
  if (!c) return res.status(404).json({ message: 'Conteneur introuvable' });
  const sorties = SORTIES.filter(s => s.numeroConteneur === c.numeroConteneur);
  const mouvements = [
    { mouvementId: 1, numeroConteneur: c.numeroConteneur, typeMouvement: 'ENTREE', description: 'Entrée en stock', dateMouvement: c.dateEntree, source: 'EDI' },
    ...(c.dateSortie ? [{ mouvementId: 2, numeroConteneur: c.numeroConteneur, typeMouvement: 'SORTIE', description: 'Sortie du site', dateMouvement: c.dateSortie, source: 'EDI' }] : []),
  ];
  const facturesLiees = FACTURES.filter(f => f._conteneurs?.some(x => x.numeroConteneur === c.numeroConteneur)).map(f => ({
    factureId: f.factureId, numeroFacture: f.numeroFacture, typeFacture: f.typeFacture, statut: f.statut,
    dateValidation: f.dateValidation, dateDebutPeriode: f.dateDebutPeriode, dateFinPeriode: f.dateFinPeriode,
    montantHT: f.montantHT, montantTVA: f.montantTVA, montantTTC: f.montantTTC,
  }));
  const operations = [
    { prestationCode: randInt(100, 999), facturable: true, operationDate: c.dateEntree, clientCode: c.clientCode },
  ];
  res.json({ conteneur: c, detail: CONTAINER_DETAILS[c.numeroConteneur] || null, sorties, mouvements, facturesLiees, operations });
});

// ─────────────────────────── ALERTES ───────────────────────────
app.get('/api/alertes', authMiddleware, (req, res) => {
  const { clientCode, includeRead, page = 1, pageSize = 20 } = req.query;
  let list = ALERTES.filter(a => a.clientCode === clientCode);
  if (!includeRead || includeRead === 'false') list = list.filter(a => !a.estLue);
  res.json(paginate(list, page, pageSize));
});

app.put('/api/alertes/:id/read', authMiddleware, (req, res) => {
  const a = ALERTES.find(x => x.alerteId === Number(req.params.id));
  if (a) { a.estLue = true; a.dateLecture = new Date().toISOString(); }
  res.json({ message: 'ok' });
});

// ─────────────────────────── SEARCH ───────────────────────────
function doSearch(q) {
  let list = CONTAINERS;
  if (q.conteneur) list = list.filter(c => c.numeroConteneur.toLowerCase().includes(String(q.conteneur).toLowerCase()));
  if (q.bad) list = list.filter(c => (c.numeroBAD || '').toLowerCase().includes(String(q.bad).toLowerCase()));
  if (q.acquit) list = list.filter(c => (c.numeroAcquitement || '').toLowerCase().includes(String(q.acquit).toLowerCase()));
  if (q.connaissement) {
    list = list.filter(c => (CONTAINER_DETAILS[c.numeroConteneur]?.numeroConnaissement || '').toLowerCase().includes(String(q.connaissement).toLowerCase()));
  }
  return list.slice(0, 50);
}
app.get('/api/search', authMiddleware, (req, res) => res.json(doSearch(req.query)));
app.get('/api/search/export', authMiddleware, (req, res) => res.json(doSearch(req.query)));

// ─────────────────────────── DOCUMENTS (PDF factices) ───────────────────────────
function makeFakePdf(label) {
  // PDF minimal valide, un seul page avec du texte.
  const text = `ONCF Portal - Document de test - ${label}`;
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 300]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${text.length + 40}>>stream
BT /F1 16 Tf 50 150 Td (${text}) Tj ET
endstream
endobj
xref
0 6
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

app.get('/api/documents/:type/:id', authMiddleware, (req, res) => {
  const pdf = makeFakePdf(`${req.params.type.toUpperCase()} ${req.params.id}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

// ─────────────────────────── FACTURES ───────────────────────────
app.get('/api/factures', authMiddleware, (req, res) => {
  const { clientCode, page = 1, size = 20, statut, search, dateFrom, dateTo, acquit } = req.query;
  let list = FACTURES.filter(f => f.clientCode === clientCode);
  if (statut) list = list.filter(f => f.statut === statut);
  if (search) list = list.filter(f => f.numeroFacture.toLowerCase().includes(String(search).toLowerCase()));
  if (dateFrom) list = list.filter(f => (f.dateDebutPeriode || '') >= dateFrom);
  if (dateTo) list = list.filter(f => (f.dateFinPeriode || '') <= dateTo);
  if (acquit) list = list.filter(f => (f.numAcquits || '').toLowerCase().includes(String(acquit).toLowerCase()));
  res.json(paginate(list.map(({ _conteneurs, ...f }) => f), page, size));
});

app.get('/api/factures/:id', authMiddleware, (req, res) => {
  const f = FACTURES.find(x => x.factureId === Number(req.params.id));
  if (!f) return res.status(404).json({ message: 'Facture introuvable' });
  const { _conteneurs, ...facture } = f;
  res.json({
    facture,
    lignes: FACTURE_LIGNES[f.factureId] || [],
    factureParent: null,
    conteneursLies: (_conteneurs || []).map(c => ({
      numeroConteneur: c.numeroConteneur, sourceOperationId: randInt(1000, 9999), clientCode: c.clientCode,
      siteLibelle: c.siteLibelle, ville: c.ville, dateEntree: c.dateEntree, dateSortie: c.dateSortie,
      statutConteneur: c.statutLogistique,
    })),
  });
});

app.get('/api/factures/:id/pdf', authMiddleware, (req, res) => {
  const pdf = makeFakePdf(`Facture ${req.params.id}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

// ─────────────────────────── ADMIN: SYNC / JOURNAL / STATS ───────────────────────────
app.get('/api/admin/sync-status', authMiddleware, (req, res) => res.json(SYNC_STATUS));

app.post('/api/admin/sync/force/:entity', authMiddleware, (req, res) => {
  const s = SYNC_STATUS.find(x => x.entityName.toLowerCase() === req.params.entity.toLowerCase());
  if (s) s.lastSuccessfulSync = new Date().toISOString();
  res.json({ message: `Synchronisation de ${req.params.entity} déclenchée avec succès` });
});

app.get('/api/admin/journal', authMiddleware, (req, res) => {
  const { limit = 50 } = req.query;
  res.json(JOURNAL.slice(0, Number(limit)));
});

app.get('/api/admin/portal-stats', authMiddleware, (req, res) => {
  res.json({
    totalConteneurs: CONTAINERS.length,
    enStockCount: CONTAINERS.filter(c => c.statutLogistique === 'EN_STOCK').length,
    totalFactures: FACTURES.length,
    totalClients: CLIENTS.length,
    totalUsersActifs: PORTAL_USERS.filter(u => u.isActive).length,
    reclamationsOuvertes: RECLAMATIONS.filter(r => r.statut === 'EN_ATTENTE' || r.statut === 'EN_COURS').length,
  });
});

// ─────────────────────────── ADMIN: USERS ───────────────────────────
app.get('/api/admin/users', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, search } = req.query;
  let list = PORTAL_USERS;
  if (search) list = list.filter(u => u.login.includes(String(search).toLowerCase()) || (u.nomClient || '').toLowerCase().includes(String(search).toLowerCase()));
  res.json(paginate(list, page, pageSize));
});

app.post('/api/admin/users', authMiddleware, (req, res) => {
  const { clientCode, login, role } = req.body || {};
  const client = CLIENTS.find(c => c.clientCode === clientCode);
  PORTAL_USERS.push({
    id: PORTAL_USERS.length + 1, clientCode: clientCode || null, login, nomClient: client?.nomClient || null,
    isAdmin: role === 'ADMIN', role: role || 'CLIENT', mustChangePwd: true, isActive: true,
    lastLogin: null, createdAt: new Date().toISOString(), totalConteneurs: 0, enStock: 0,
  });
  USERS.push({ id: 900 + USERS.length, login, password: 'temp1234', role: role || 'CLIENT', clientCode: clientCode || null, nomClient: client?.nomClient || '', mustChangePwd: true });
  res.json({ temporaryPassword: 'temp1234' });
});

app.delete('/api/admin/users/:clientCode', authMiddleware, (req, res) => {
  const idx = PORTAL_USERS.findIndex(u => u.clientCode === req.params.clientCode);
  if (idx >= 0) PORTAL_USERS.splice(idx, 1);
  res.json({ message: 'Utilisateur supprimé' });
});

app.put('/api/admin/users/:clientCode/reset-password', authMiddleware, (req, res) => {
  res.json({ temporaryPassword: 'temp' + randInt(1000, 9999) });
});

app.put('/api/admin/users/:clientCode/toggle', authMiddleware, (req, res) => {
  const u = PORTAL_USERS.find(x => x.clientCode === req.params.clientCode);
  if (u) u.isActive = req.query.active === 'true';
  res.json({ message: 'ok' });
});

// ─────────────────────────── RECLAMATIONS ───────────────────────────
app.get('/api/reclamations', authMiddleware, (req, res) => {
  const { page = 1, size = 20, statut, search } = req.query;
  let list;
  if (req.user.role === 'AGENT' || req.user.role === 'ADMIN') {
    list = RECLAMATIONS;
  } else {
    list = RECLAMATIONS.filter(r => r.clientCode === (req.query.clientCode || req.user.clientCode));
  }
  if (statut) list = list.filter(r => r.statut === statut);
  if (search) list = list.filter(r => r.objet.toLowerCase().includes(String(search).toLowerCase()) || r.numeroReference.toLowerCase().includes(String(search).toLowerCase()));
  res.json(paginate(list, page, size));
});

app.post('/api/reclamations', authMiddleware, (req, res) => {
  const payload = req.body || {};
  const id = RECLAMATIONS.length + 1;
  const rec = {
    id,
    numeroReference: `REC-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`,
    clientCode: payload.clientCode || req.user.clientCode,
    categorie: payload.categorie,
    objet: payload.objet,
    description: payload.description,
    numeroConteneur: payload.numeroConteneur,
    numeroFacture: payload.numeroFacture,
    telephoneContact: payload.telephoneContact,
    statut: 'EN_ATTENTE',
    dateCreation: new Date().toISOString(),
    dateMaj: new Date().toISOString(),
  };
  RECLAMATIONS.push(rec);
  RECLAMATION_AUDIT[id] = [{ auditId: id * 10 + 1, oldStatut: null, newStatut: 'EN_ATTENTE', changedByLogin: req.user.login, changedAt: rec.dateCreation, note: 'Création' }];
  res.json(rec);
});

app.get('/api/reclamations/:id', authMiddleware, (req, res) => {
  const r = RECLAMATIONS.find(x => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ message: 'Réclamation introuvable' });
  res.json(r);
});

app.put('/api/reclamations/:id', authMiddleware, (req, res) => {
  const r = RECLAMATIONS.find(x => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ message: 'Réclamation introuvable' });
  const { statut, reponseAdmin, note } = req.body || {};
  const old = r.statut;
  if (statut) r.statut = statut;
  if (reponseAdmin !== undefined) r.reponseAdmin = reponseAdmin;
  r.dateMaj = new Date().toISOString();
  if (statut) {
    RECLAMATION_AUDIT[r.id] = RECLAMATION_AUDIT[r.id] || [];
    RECLAMATION_AUDIT[r.id].push({ auditId: RECLAMATION_AUDIT[r.id].length + r.id * 10 + 1, oldStatut: old, newStatut: statut, changedByLogin: req.user.login, changedAt: r.dateMaj, note: note || null });
  }
  res.json({ message: 'ok' });
});

app.get('/api/reclamations/:id/audit', authMiddleware, (req, res) => {
  res.json(RECLAMATION_AUDIT[Number(req.params.id)] || []);
});

app.get('/api/admin/reclamations', authMiddleware, (req, res) => {
  const { page = 1, size = 20, statut, categorie, search } = req.query;
  let list = RECLAMATIONS;
  if (statut) list = list.filter(r => r.statut === statut);
  if (categorie) list = list.filter(r => r.categorie === categorie);
  if (search) list = list.filter(r => r.objet.toLowerCase().includes(String(search).toLowerCase()));
  res.json(paginate(list, page, size));
});

// ─────────────────────────── SIMULATEUR ───────────────────────────
app.get('/api/simulateur/:clientCode/acquits', authMiddleware, (req, res) => {
  const conts = CONTAINERS.filter(c => c.clientCode === req.params.clientCode && c.statutLogistique === 'EN_STOCK');
  const byAcquit = {};
  conts.forEach(c => {
    byAcquit[c.numeroAcquitement] = byAcquit[c.numeroAcquitement] || { numeroAcquit: c.numeroAcquitement, nbConteneurs: 0, premierEntree: c.dateEntree, numeroConnaissement: CONTAINER_DETAILS[c.numeroConteneur]?.numeroConnaissement || null };
    byAcquit[c.numeroAcquitement].nbConteneurs++;
  });
  res.json(Object.values(byAcquit));
});

app.get('/api/simulateur/:clientCode/conteneurs', authMiddleware, (req, res) => {
  const { acquit } = req.query;
  const conts = CONTAINERS.filter(c => c.clientCode === req.params.clientCode && c.numeroAcquitement === acquit && c.statutLogistique === 'EN_STOCK');
  res.json(conts.map(c => ({
    numeroConteneur: c.numeroConteneur, typeConteneur: c.typeConteneur, tailleConteneur: c.tailleConteneur,
    dateEntree: c.dateEntree, siteLibelle: c.siteLibelle, nombreJours: c.nombreJoursStockage,
    numeroConnaissement: CONTAINER_DETAILS[c.numeroConteneur]?.numeroConnaissement || null,
  })));
});

function buildSimuConteneur(c) {
  const jours = c.nombreJoursStockage || randInt(1, 30);
  const puMagasinage = 15;
  const montantMagasinage = jours * puMagasinage;
  return {
    numeroConteneur: c.numeroConteneur,
    typeConteneur: c.typeConteneur,
    tailleConteneur: c.tailleConteneur,
    typeTC: c.tailleConteneur,
    dateEntree: c.dateEntree,
    nombreJours: jours,
    numeroAcquit: c.numeroAcquitement,
    donneurOrdre: CONTAINER_DETAILS[c.numeroConteneur]?.donneurOrdre || null,
    tranches: [
      { designation: 'Franchise (0-5 jours)', nombreJours: Math.min(jours, 5), prixUnitaire: 0, montantHT: 0, montantTTC: 0 },
      { designation: 'Magasinage jours suivants', nombreJours: Math.max(jours - 5, 0), prixUnitaire: puMagasinage, montantHT: montantMagasinage, montantTTC: Math.round(montantMagasinage * 1.2) },
    ],
    montantHT: montantMagasinage,
    montantTTC: Math.round(montantMagasinage * 1.2),
  };
}

app.post('/api/simulateur/:clientCode', authMiddleware, (req, res) => {
  const { dateSortieEstimee, numeroAcquit, conteneurs } = req.body || {};
  const conts = CONTAINERS.filter(c => conteneurs?.includes(c.numeroConteneur));
  const simuConts = conts.map(buildSimuConteneur);
  const totalHT = simuConts.reduce((s, c) => s + c.montantHT, 0);
  const totalTTC = simuConts.reduce((s, c) => s + c.montantTTC, 0);
  res.json({
    clientCode: req.params.clientCode,
    dateSimulation: new Date().toISOString(),
    dateSortieEstimee,
    conteneurs: simuConts,
    totaux: {
      nombreConteneurs: simuConts.length,
      nombreConteneurs20: simuConts.filter(c => c.tailleConteneur === '20').length,
      nombreConteneurs40: simuConts.filter(c => c.tailleConteneur !== '20').length,
      nombreUnites: simuConts.length,
      nombreAcquits: 1,
      totalMagasinage_HT: totalHT,
      totalMagasinage_TTC: totalTTC,
      fraisManutention_HT: simuConts.length * 200,
      fraisManutention_TauxTVA: 20,
      fraisManutentionAPM_HT: 0,
      fraisOperationDoc_HT: 100,
      fraisOperationDoc_TauxTVA: 20,
      fraisScelle_HT: simuConts.length * 30,
      fraisScelle_NbTC: simuConts.length,
      fraisRedevanceInfo_HT: 50,
      fraisCamionnage_HT: 0,
      fraisCamionnage_TauxTVA: 20,
      fraisCamionnage_NbAcquits: 1,
      totalMaersk_HT: 0,
      fraisOperationsClientFinal_HT: 0,
      fraisOperationsClientFinal_TTC: 0,
      totalGeneral_HT: totalHT + simuConts.length * 330 + 150,
      totalGeneral_TTC: Math.round((totalHT + simuConts.length * 330 + 150) * 1.2),
    },
    perspective: 'ClientDirect',
    operationsClientFinal: [],
  });
});

app.post('/api/simulateur/:clientCode/pdf', authMiddleware, (req, res) => {
  const pdf = makeFakePdf(`Facture Simulée ${req.params.clientCode}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

// ─────────────────────────── SIMULATEUR HORS DOUANE ───────────────────────────
app.get('/api/simulateur-hd/:clientCode/conteneurs', authMiddleware, (req, res) => {
  const conts = CONTAINERS.filter(c => c.clientCode === req.params.clientCode && c.statutLogistique === 'EN_STOCK' && c.typeActivite !== 'IMPORT');
  res.json(conts.map(c => ({
    numeroConteneur: c.numeroConteneur, tailleConteneur: c.tailleConteneur, typeConteneur: c.typeConteneur,
    dateEntree: c.dateEntree, siteLibelle: c.siteLibelle,
    donneurOrdre: CONTAINER_DETAILS[c.numeroConteneur]?.donneurOrdre || null,
    clientFinal: CONTAINER_DETAILS[c.numeroConteneur]?.clientFinal || null,
  })));
});

app.post('/api/simulateur-hd/:clientCode', authMiddleware, (req, res) => {
  const { dateSortieEstimee, conteneurs } = req.body || {};
  const conts = CONTAINERS.filter(c => conteneurs?.includes(c.numeroConteneur));
  const results = conts.map(c => {
    const jours = c.nombreJoursStockage || randInt(1, 30);
    const facturables = Math.max(jours - 5, 0);
    const magasinageHT = facturables * 15;
    const manutentionHT = 200;
    return {
      numeroConteneur: c.numeroConteneur,
      typeTC: c.tailleConteneur,
      siteLibelle: c.siteLibelle,
      dateEntree: c.dateEntree,
      nombreJours: jours,
      joursFacturables: facturables,
      tranches: [{ designation: 'Magasinage', nombreJours: facturables, prixUnitaire: 15, montantHT: magasinageHT }],
      magasinageHT,
      manutentionHT,
      totalHT: magasinageHT + manutentionHT,
      totalTTC: Math.round((magasinageHT + manutentionHT) * 1.2),
    };
  });
  const totalMagasinageHT = results.reduce((s, r) => s + r.magasinageHT, 0);
  const totalManutentionHT = results.reduce((s, r) => s + r.manutentionHT, 0);
  res.json({
    clientCode: req.params.clientCode,
    dateSimulation: new Date().toISOString(),
    dateSortieEstimee,
    hasConfig: true,
    franchiseJours: 5,
    billingCas: 1,
    conteneurs: results,
    totaux: {
      nombreConteneurs: results.length,
      nombreConteneurs20: results.filter(r => r.typeTC === '20').length,
      nombreConteneurs40: results.filter(r => r.typeTC !== '20').length,
      totalMagasinage_HT: totalMagasinageHT,
      totalMagasinage_TTC: Math.round(totalMagasinageHT * 1.2),
      totalManutention_HT: totalManutentionHT,
      totalGeneral_HT: totalMagasinageHT + totalManutentionHT,
      totalGeneral_TTC: Math.round((totalMagasinageHT + totalManutentionHT) * 1.2),
    },
  });
});

app.post('/api/simulateur-hd/:clientCode/pdf', authMiddleware, (req, res) => {
  const pdf = makeFakePdf(`Facture Simulée HD ${req.params.clientCode}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

app.listen(PORT, () => {
  console.log(`✅ Backend mock ONCF Portal démarré sur http://localhost:${PORT}`);
  console.log('Comptes de test:');
  console.log('  admin   / admin123   (ADMIN)');
  console.log('  agent   / agent123   (AGENT)');
  console.log('  maer001 / client123  (CLIENT - Maersk Morocco)');
  console.log('  cmacgm1 / client123  (CLIENT - CMA CGM Maroc)');
  console.log('  transm1 / client123  (CLIENT - Transimex SARL)');
  console.log('  atlas01 / client123  (CLIENT - Atlas Import Export)');
  console.log('  nouveau / temp123    (CLIENT - doit changer son mot de passe)');
});
