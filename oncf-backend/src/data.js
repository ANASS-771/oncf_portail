// Génère un jeu de données fictif mais cohérent pour tester le frontend ONCF Portal.

const SITES = [
  { code: 'CST', libelle: 'Casablanca Sud', ville: 'Casablanca' },
  { code: 'MFR', libelle: 'Mohammedia Fret', ville: 'Mohammedia' },
  { code: 'TGR', libelle: 'Tanger Med', ville: 'Tanger' },
  { code: 'KNT', libelle: 'Kénitra Fret', ville: 'Kénitra' },
];

const ACTIVITES = ['IMPORT', 'EXPORT', 'TRANSIT', 'CABOTAGE'];
const PORTS = ['CASABLANCA', 'TANGER MED', 'AGADIR', 'ANVERS', 'VALENCE'];
const NAVIRES = ['MSC LUCINDA', 'CMA CGM MOZART', 'MAERSK ESSEX', 'HAPAG LLOYD BERLIN'];
const TRANSITAIRES = ['TRANSIMEX SARL', 'AFRIC TRANSIT', 'GLOBAL LOGISTICS MA', 'ATLAS FORWARDING'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n, len) { return String(n).padStart(len, '0'); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function isoDate(d) { return d.toISOString().slice(0, 10); }

const CLIENTS = [
  { clientCode: 'MAER001', nomClient: 'Maersk Morocco' },
  { clientCode: 'CMACGM1', nomClient: 'CMA CGM Maroc' },
  { clientCode: 'TRANSM1', nomClient: 'Transimex SARL' },
  { clientCode: 'ATLAS01', nomClient: 'Atlas Import Export' },
];

// ── Conteneurs ──
let containerSeq = 1;
function makeContainer(clientCode) {
  const site = rand(SITES);
  const entreeJours = randInt(1, 90);
  const sorti = Math.random() < 0.35;
  const num = `MSKU${pad(containerSeq++, 7)}`;
  const type = rand(['DRY', 'REEFER', 'OPEN TOP', 'FLAT RACK']);
  const taille = rand(['20', '40', '40HC']);
  return {
    numeroConteneur: num,
    clientCode,
    siteCode: site.code,
    siteLibelle: site.libelle,
    ville: site.ville,
    dateEntree: daysAgo(entreeJours),
    dateSortie: sorti ? daysAgo(randInt(0, entreeJours - 1)) : null,
    statutLogistique: sorti ? 'SORTI' : 'EN_STOCK',
    typeConteneur: type,
    tailleConteneur: taille,
    numeroBAD: `BAD${pad(randInt(1000, 9999), 4)}`,
    typeActivite: rand(ACTIVITES),
    typeStockage: rand(['NORMAL', 'FRIGORIFIQUE', 'DANGEREUX']),
    portChargement: rand(PORTS),
    sourceEntreeId: `SRC${randInt(100000, 999999)}`,
    lastSync: daysAgo(randInt(0, 2)),
    nombreJoursStockage: sorti ? 0 : entreeJours,
    numeroAcquitement: `ACQ${randInt(10000, 99999)}`,
    moyenTransport: rand(['CAMION', 'TRAIN', 'CAMION+TRAIN']),
    hasPesage: Math.random() < 0.6,
    typeVisite: rand(['VISITE_CONFORME', 'VISITE_LITIGE', null]),
  };
}

const CONTAINERS = [];
CLIENTS.forEach(c => {
  for (let i = 0; i < 40; i++) CONTAINERS.push(makeContainer(c.clientCode));
});

const CONTAINER_DETAILS = {};
CONTAINERS.forEach(c => {
  CONTAINER_DETAILS[c.numeroConteneur] = {
    numeroDemande: `DEM${randInt(10000, 99999)}`,
    declarationSommaire: `DS${randInt(100000, 999999)}`,
    numeroAcquitement: c.numeroAcquitement,
    dateAcquit: daysAgo(randInt(1, 100)),
    navire: rand(NAVIRES),
    portArrive: rand(PORTS),
    portOrigine: rand(PORTS),
    numeroConnaissement: `BL${randInt(100000, 999999)}`,
    destinataire: rand(CLIENTS).nomClient,
    poidsBrut: randInt(5000, 28000),
    poidsTare: randInt(2000, 4000),
    natureMarchandise: rand(['TEXTILE', 'ELECTRONIQUE', 'PIECES AUTO', 'PRODUITS ALIMENTAIRES']),
    codeTAR: `${randInt(1000, 9999)}.${randInt(10, 99)}`,
    donneurOrdre: rand(CLIENTS).nomClient,
    clientFinal: rand(CLIENTS).nomClient,
  };
});

// ── Sorties ──
let sortieSeq = 1;
const SORTIES = [];
CONTAINERS.filter(c => c.statutLogistique === 'SORTI').forEach(c => {
  SORTIES.push({
    id: sortieSeq++,
    numeroConteneur: c.numeroConteneur,
    numDemandeSortie: `DS${randInt(10000, 99999)}`,
    numBLC: `BLC${randInt(10000, 99999)}`,
    numBonSortie: `BS${randInt(10000, 99999)}`,
    dateSortie: c.dateSortie,
    dateDemande: c.dateSortie,
    moyenTransport: c.moyenTransport,
    activite: c.typeActivite,
    libelleTransitaire: rand(TRANSITAIRES),
    libelleClient: CLIENTS.find(cl => cl.clientCode === c.clientCode)?.nomClient || c.clientCode,
    etatConteneur: rand(['BON_ETAT', 'ENDOMMAGE']),
    numeroAcquitement: c.numeroAcquitement,
  });
});

// ── Alertes ──
let alerteSeq = 1;
const ALERTES = [];
CLIENTS.forEach(cl => {
  for (let i = 0; i < 8; i++) {
    const c = rand(CONTAINERS.filter(x => x.clientCode === cl.clientCode));
    ALERTES.push({
      alerteId: alerteSeq++,
      numeroConteneur: c.numeroConteneur,
      clientCode: cl.clientCode,
      typeAlerte: rand(['SURSTOCKAGE', 'RETARD_SORTIE', 'DOCUMENT_MANQUANT', 'FRANCHISE_DEPASSEE']),
      niveauAlerte: rand(['INFO', 'WARNING', 'CRITIQUE']),
      titre: rand(['Franchise de stockage dépassée', 'Retard de sortie détecté', 'Document manquant', 'Surstockage constaté']),
      message: 'Merci de vérifier la situation du conteneur concerné.',
      estLue: Math.random() < 0.4,
      dateAlerte: daysAgo(randInt(0, 20)),
      dateLecture: null,
    });
  }
});

// ── Factures ──
let factureSeq = 1;
const FACTURES = [];
CLIENTS.forEach(cl => {
  for (let i = 0; i < 10; i++) {
    const montantHT = randInt(2000, 45000);
    const tva = Math.round(montantHT * 0.2);
    const relatedContainers = CONTAINERS.filter(c => c.clientCode === cl.clientCode).slice(0, randInt(1, 4));
    FACTURES.push({
      factureId: factureSeq,
      sourceFactureId: 900000 + factureSeq,
      clientCode: cl.clientCode,
      numeroFacture: `FA${new Date().getFullYear()}${pad(factureSeq, 5)}`,
      typeFacture: rand(['MAGASINAGE', 'MANUTENTION', 'MIXTE']),
      estManuelle: false,
      dateDebutPeriode: isoDate(new Date(daysAgo(60))),
      dateFinPeriode: isoDate(new Date(daysAgo(30))),
      statut: rand(['PREVALIDEE', 'VALIDEE', 'VALIDEE', 'ANNULEE']),
      dateValidation: daysAgo(randInt(1, 30)),
      montantHT,
      montantTVA: tva,
      montantTTC: montantHT + tva,
      conteneurs: relatedContainers.map(c => c.numeroConteneur).join(', '),
      numAcquits: relatedContainers.map(c => c.numeroAcquitement).join(', '),
      connaissements: relatedContainers.map(() => `BL${randInt(100000, 999999)}`).join(', '),
      trains: '',
      ice: `00${randInt(1000000, 9999999)}`,
      telephoneClient: `05${randInt(20000000, 39999999)}`,
      dateMajSource: daysAgo(randInt(0, 5)),
      _conteneurs: relatedContainers,
    });
    factureSeq++;
  }
});

const FACTURE_LIGNES = {};
FACTURES.forEach(f => {
  FACTURE_LIGNES[f.factureId] = Array.from({ length: randInt(2, 5) }, (_, i) => {
    const pu = randInt(50, 500);
    const qte = randInt(1, 10);
    const montantHT = pu * qte;
    return {
      ligneId: f.factureId * 100 + i,
      sourceFactureId: f.sourceFactureId,
      numLigne: i + 1,
      designation: rand(['Magasinage jours supplémentaires', 'Manutention conteneur', 'Frais de dossier', 'Redevance informatique', 'Camionnage']),
      nbreTC: randInt(1, 3),
      quantite: qte,
      prixUnitaire: pu,
      montantHT,
      tauxTVA: 20,
      montantTTC: Math.round(montantHT * 1.2),
      codePrestation: `PR${randInt(100, 999)}`,
    };
  });
});

// ── Réclamations ──
let reclamationSeq = 1;
const RECLAMATIONS = [];
const CATEGORIES = ['RETARD_CHARGEMENT_TC', 'RETARD_ACHEMINEMENT', 'RETARD_ENVOI_BAD', 'TC_ENDOMMAGE', 'CONTESTATION_FACTURE', 'INDISPO_ENGIN', 'ERREUR_MONTANT_FACTURE', 'COMPORTEMENT_PERSONNEL', 'RETARD_OPERATIONS', 'AUTRE'];
CLIENTS.forEach(cl => {
  for (let i = 0; i < 6; i++) {
    const statut = rand(['EN_ATTENTE', 'EN_COURS', 'RESOLUE', 'FERMEE']);
    const c = rand(CONTAINERS.filter(x => x.clientCode === cl.clientCode));
    RECLAMATIONS.push({
      id: reclamationSeq,
      numeroReference: `REC-${new Date().getFullYear()}-${pad(reclamationSeq, 4)}`,
      clientCode: cl.clientCode,
      categorie: rand(CATEGORIES),
      objet: 'Réclamation concernant le conteneur ' + c.numeroConteneur,
      description: "Détail de la réclamation soumise par le client concernant une anomalie constatée sur ce dossier.",
      numeroConteneur: c.numeroConteneur,
      numeroFacture: Math.random() < 0.3 ? rand(FACTURES.filter(f => f.clientCode === cl.clientCode))?.numeroFacture : undefined,
      telephoneContact: `06${randInt(20000000, 39999999)}`,
      statut,
      dateCreation: daysAgo(randInt(5, 60)),
      dateMaj: daysAgo(randInt(0, 5)),
      reponseAdmin: statut === 'RESOLUE' || statut === 'FERMEE' ? "Dossier traité, régularisation effectuée." : undefined,
      dateReponse: statut === 'RESOLUE' || statut === 'FERMEE' ? daysAgo(randInt(0, 3)) : undefined,
      assignedToLogin: Math.random() < 0.5 ? 'agent' : null,
      assignedAt: Math.random() < 0.5 ? daysAgo(randInt(1, 10)) : null,
    });
    reclamationSeq++;
  }
});

const RECLAMATION_AUDIT = {};
RECLAMATIONS.forEach(r => {
  RECLAMATION_AUDIT[r.id] = [
    { auditId: r.id * 10 + 1, oldStatut: null, newStatut: 'EN_ATTENTE', changedByLogin: 'client', changedAt: r.dateCreation, note: 'Création de la réclamation' },
    { auditId: r.id * 10 + 2, oldStatut: 'EN_ATTENTE', newStatut: r.statut, changedByLogin: 'agent', changedAt: r.dateMaj, note: r.reponseAdmin || null },
  ];
});

// ── Users portail ──
const PORTAL_USERS = CLIENTS.map((cl, i) => ({
  id: i + 1,
  clientCode: cl.clientCode,
  login: cl.clientCode.toLowerCase(),
  nomClient: cl.nomClient,
  isAdmin: false,
  role: 'CLIENT',
  mustChangePwd: false,
  isActive: true,
  lastLogin: daysAgo(randInt(0, 5)),
  createdAt: daysAgo(200),
  totalConteneurs: CONTAINERS.filter(c => c.clientCode === cl.clientCode).length,
  enStock: CONTAINERS.filter(c => c.clientCode === cl.clientCode && c.statutLogistique === 'EN_STOCK').length,
}));

// ── Sync status / journal ──
const SYNC_ENTITIES = ['Conteneurs', 'Sorties', 'Factures', 'Alertes', 'Clients'];
const SYNC_STATUS = SYNC_ENTITIES.map(e => ({
  entityName: e,
  lastSuccessfulSync: daysAgo(randInt(0, 1)),
  watermarkValue: new Date().toISOString(),
  status: 'OK',
  nextScheduledRun: new Date(Date.now() + 3600000).toISOString(),
  lastAttempt: daysAgo(0),
  lastError: null,
}));

const JOURNAL = Array.from({ length: 30 }, (_, i) => ({
  journalId: i + 1,
  nomJob: rand(SYNC_ENTITIES) + '_Sync',
  dateDebut: daysAgo(i),
  dateFin: daysAgo(i),
  nbTraites: randInt(10, 500),
  statut: rand(['SUCCES', 'SUCCES', 'SUCCES', 'ECHEC']),
  messageErreur: null,
}));

module.exports = {
  SITES, ACTIVITES, CLIENTS, CONTAINERS, CONTAINER_DETAILS, SORTIES, ALERTES,
  FACTURES, FACTURE_LIGNES, RECLAMATIONS, RECLAMATION_AUDIT, PORTAL_USERS,
  SYNC_STATUS, JOURNAL, rand, randInt, pad, daysAgo, isoDate,
};
