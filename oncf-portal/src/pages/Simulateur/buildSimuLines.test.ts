import { describe, it, expect } from 'vitest';
import { buildSimuLines } from './buildSimuLines';
import type { SimulateurResponse, SimulateurConteneur, SimulateurTotaux } from '../../types';
import {
  SIMU_MANUT_PU, SIMU_APM_PU, SIMU_OP_DOC_PU_MAERSK,
  SIMU_OP_DOC_PU_STD, SIMU_REDEVANCE_PU, SIMU_CAMIONNAGE_PU,
} from '../../constants';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeTotaux(overrides: Partial<SimulateurTotaux> = {}): SimulateurTotaux {
  return {
    nombreConteneurs: 1, nombreConteneurs20: 1, nombreConteneurs40: 0,
    nombreUnites: 1, nombreAcquits: 1,
    totalMagasinage_HT: 0, totalMagasinage_TTC: 0,
    fraisManutention_HT: 0, fraisManutention_TauxTVA: 20,
    fraisManutentionAPM_HT: 0,
    fraisOperationDoc_HT: 0, fraisOperationDoc_TauxTVA: 20,
    fraisScelle_HT: 0, fraisScelle_NbTC: 0,
    fraisRedevanceInfo_HT: 0,
    fraisCamionnage_HT: 0, fraisCamionnage_TauxTVA: 20, fraisCamionnage_NbAcquits: 0,
    totalMaersk_HT: 0,
    fraisOperationsClientFinal_HT: 0, fraisOperationsClientFinal_TTC: 0,
    totalGeneral_HT: 0, totalGeneral_TTC: 0,
    ...overrides,
  };
}

function makeConteneur(overrides: Partial<SimulateurConteneur> = {}): SimulateurConteneur {
  return {
    numeroConteneur: 'TCKU1234567', typeConteneur: '20', tailleConteneur: '20',
    typeTC: 'GP', dateEntree: '2025-01-01', nombreJours: 10,
    numeroAcquit: 'ACQ001', donneurOrdre: null,
    tranches: [], montantHT: 0, montantTTC: 0,
    ...overrides,
  };
}

function makeResponse(overrides: Partial<SimulateurResponse> = {}): SimulateurResponse {
  return {
    clientCode: 'CLI001', dateSimulation: '2025-01-10', dateSortieEstimee: '2025-01-15',
    conteneurs: [], totaux: makeTotaux(), perspective: 'Admin',
    operationsClientFinal: [],
    ...overrides,
  };
}

// ── magasinage ────────────────────────────────────────────────────────────────

describe('magasinage tranches', () => {
  it('aggregates same-designation tranches across multiple containers', () => {
    const response = makeResponse({
      conteneurs: [
        makeConteneur({ tranches: [
          { designation: 'Mag 0-15j', nombreJours: 10, prixUnitaire: 12, montantHT: 120, montantTTC: 144 },
          { designation: 'Mag 16-30j', nombreJours: 5, prixUnitaire: 18, montantHT: 90, montantTTC: 108 },
        ] }),
        makeConteneur({ numeroConteneur: 'MSCU7654321', tranches: [
          { designation: 'Mag 0-15j', nombreJours: 8, prixUnitaire: 12, montantHT: 96, montantTTC: 115.2 },
        ] }),
      ],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });

    const lines = buildSimuLines(response);
    expect(lines).toHaveLength(2);

    const t1 = lines.find(l => l.label === 'Mag 0-15j')!;
    expect(t1.qte).toBe(18);       // 10 + 8 jours
    expect(t1.ht).toBeCloseTo(216); // 120 + 96
    expect(t1.pu).toBe(12);

    const t2 = lines.find(l => l.label === 'Mag 16-30j')!;
    expect(t2.qte).toBe(5);
    expect(t2.ht).toBe(90);
  });

  it('applies TVA 20% on tranches with prixUnitaire > 0', () => {
    const response = makeResponse({
      conteneurs: [makeConteneur({ tranches: [
        { designation: 'T1', nombreJours: 5, prixUnitaire: 10, montantHT: 50, montantTTC: 60 },
      ] })],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    const [line] = buildSimuLines(response);
    expect(line.tva).toBe(20);
  });

  it('skips magasinage for DonneurOrdre perspective', () => {
    const response = makeResponse({
      perspective: 'DonneurOrdre',
      conteneurs: [makeConteneur({ tranches: [
        { designation: 'T1', nombreJours: 5, prixUnitaire: 10, montantHT: 50, montantTTC: 60 },
      ] })],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    expect(buildSimuLines(response)).toHaveLength(0);
  });
});

// ── operation fees ────────────────────────────────────────────────────────────

describe('operation fees (showOpFees enabled via totalMaersk_HT > 0)', () => {
  it('adds manutention line using SIMU_MANUT_PU constant', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        nombreConteneurs: 2, nombreUnites: 2,
        totalMaersk_HT: 2 * SIMU_MANUT_PU,
        fraisManutention_HT: 2 * SIMU_MANUT_PU,
        fraisManutention_TauxTVA: 20,
      }),
    });
    const lines = buildSimuLines(response);
    const manut = lines.find(l => l.label === 'Manutention')!;
    expect(manut).toBeDefined();
    expect(manut.pu).toBe(SIMU_MANUT_PU);
    expect(manut.ht).toBe(2 * SIMU_MANUT_PU);
    expect(manut.tva).toBe(20);
  });

  it('adds APM Terminal manutention line using SIMU_APM_PU constant', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        nombreConteneurs: 2,
        totalMaersk_HT: 2 * SIMU_APM_PU,
        fraisManutentionAPM_HT: 2 * SIMU_APM_PU,
      }),
    });
    const lines = buildSimuLines(response);
    const apm = lines.find(l => l.label === 'Manutention APM Terminal Ferroviaire Tanger Med')!;
    expect(apm).toBeDefined();
    expect(apm.pu).toBe(SIMU_APM_PU);
    expect(apm.ht).toBe(2 * SIMU_APM_PU);
    expect(apm.tva).toBe(0);

    expect(lines.find(l => l.label === 'Manutention')).toBeUndefined();
  });

  it('adds OpDoc at SIMU_OP_DOC_PU_MAERSK rate when TVA rate is 0 (Maersk)', () => {
    const nbTC = 2;
    const response = makeResponse({
      totaux: makeTotaux({
        nombreConteneurs: nbTC,
        totalMaersk_HT: nbTC * SIMU_OP_DOC_PU_MAERSK,
        fraisOperationDoc_HT: nbTC * SIMU_OP_DOC_PU_MAERSK,
        fraisOperationDoc_TauxTVA: 0,
      }),
    });
    const lines = buildSimuLines(response);
    const opDoc = lines.find(l => l.label === 'Opérations documentaires')!;
    expect(opDoc.pu).toBe(SIMU_OP_DOC_PU_MAERSK);
    expect(opDoc.tva).toBe(0);
    expect(opDoc.tc).toBe(nbTC);
  });

  it('adds OpDoc at SIMU_OP_DOC_PU_STD rate when TVA rate is 20 (standard)', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        totalMaersk_HT: SIMU_OP_DOC_PU_STD,
        fraisOperationDoc_HT: SIMU_OP_DOC_PU_STD,
        fraisOperationDoc_TauxTVA: 20,
        nombreAcquits: 1,
      }),
    });
    const lines = buildSimuLines(response);
    const opDoc = lines.find(l => l.label === 'Opérations documentaires')!;
    expect(opDoc.pu).toBe(SIMU_OP_DOC_PU_STD);
    expect(opDoc.tva).toBe(20);
    expect(opDoc.tc).toBeNull();
  });

  it('adds redevance informatique using SIMU_REDEVANCE_PU constant', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        totalMaersk_HT: SIMU_REDEVANCE_PU,
        fraisRedevanceInfo_HT: SIMU_REDEVANCE_PU,
        nombreAcquits: 1,
      }),
    });
    const lines = buildSimuLines(response);
    const rev = lines.find(l => l.label === 'Redevance informatique')!;
    expect(rev).toBeDefined();
    expect(rev.pu).toBe(SIMU_REDEVANCE_PU);
    expect(rev.tva).toBe(0);
  });

  it('adds camionnage using SIMU_CAMIONNAGE_PU constant', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        totalMaersk_HT: SIMU_CAMIONNAGE_PU,
        fraisCamionnage_HT: SIMU_CAMIONNAGE_PU,
        fraisCamionnage_NbAcquits: 1,
        fraisCamionnage_TauxTVA: 20,
      }),
    });
    const lines = buildSimuLines(response);
    const cam = lines.find(l => l.label === 'Camionnage')!;
    expect(cam).toBeDefined();
    expect(cam.pu).toBe(SIMU_CAMIONNAGE_PU);
    expect(cam.ht).toBe(SIMU_CAMIONNAGE_PU);
  });

  it('excludes operation rows with ht <= 0', () => {
    const response = makeResponse({
      totaux: makeTotaux({
        totalMaersk_HT: SIMU_MANUT_PU,
        fraisManutention_HT: SIMU_MANUT_PU,
        fraisOperationDoc_HT: 0,
        fraisRedevanceInfo_HT: 0,
      }),
    });
    const labels = buildSimuLines(response).map(l => l.label);
    expect(labels).toContain('Manutention');
    expect(labels).not.toContain('Opérations documentaires');
    expect(labels).not.toContain('Redevance informatique');
  });

  it('skips all op fees when totalMaersk_HT is 0', () => {
    const response = makeResponse({
      totaux: makeTotaux({ totalMaersk_HT: 0, fraisManutention_HT: SIMU_MANUT_PU }),
    });
    const labels = buildSimuLines(response).map(l => l.label);
    expect(labels).not.toContain('Manutention');
  });
});

// ── client-final operations ───────────────────────────────────────────────────

describe('client-final operations', () => {
  it('adds a client-final op with correct amounts', () => {
    const response = makeResponse({
      operationsClientFinal: [
        { numeroConteneur: 'TCKU1234567', prestationCode: 14, designation: 'Pesage',
          nbOps: 1, pu: 100, montantHT: 100, tauxTVA: 20, montantTTC: 120, isSurDevis: false },
      ],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    const lines = buildSimuLines(response);
    const pesage = lines.find(l => l.label.includes('Pesage'))!;
    expect(pesage).toBeDefined();
    expect(pesage.ht).toBe(100);
    expect(pesage.pu).toBe(100);
    expect(pesage.tva).toBe(20);
    expect(pesage.isSurDevis).toBeUndefined();
  });

  it('deduplicates ops with same (numeroConteneur, prestationCode)', () => {
    const op = { numeroConteneur: 'TCKU1234567', prestationCode: 14, designation: 'Pesage',
      nbOps: 1, pu: 100, montantHT: 100, tauxTVA: 20, montantTTC: 120, isSurDevis: false };
    const response = makeResponse({
      operationsClientFinal: [op, op],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    expect(buildSimuLines(response).filter(l => l.label.includes('Pesage'))).toHaveLength(1);
  });

  it('marks sur-devis operations with isSurDevis flag and zero amounts', () => {
    const response = makeResponse({
      operationsClientFinal: [
        { numeroConteneur: 'TCKU1234567', prestationCode: 116, designation: 'Visite Partielle',
          nbOps: 0, pu: 0, montantHT: 0, tauxTVA: 20, montantTTC: 0, isSurDevis: true },
      ],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    const visite = buildSimuLines(response).find(l => l.label.includes('Visite Partielle'))!;
    expect(visite.isSurDevis).toBe(true);
    expect(visite.ht).toBe(0);
    expect(visite.pu).toBe(0);
  });

  it('skips client-final ops for DonneurOrdre perspective', () => {
    const response = makeResponse({
      perspective: 'DonneurOrdre',
      operationsClientFinal: [
        { numeroConteneur: 'TCKU1234567', prestationCode: 14, designation: 'Pesage',
          nbOps: 1, pu: 100, montantHT: 100, tauxTVA: 20, montantTTC: 120, isSurDevis: false },
      ],
      totaux: makeTotaux({ totalMaersk_HT: 0 }),
    });
    expect(buildSimuLines(response)).toHaveLength(0);
  });
});

// ── line numbering ────────────────────────────────────────────────────────────

describe('line numbering', () => {
  it('assigns sequential numbers starting at 1', () => {
    const response = makeResponse({
      conteneurs: [makeConteneur({ tranches: [
        { designation: 'T1', nombreJours: 5, prixUnitaire: 10, montantHT: 50, montantTTC: 60 },
      ] })],
      totaux: makeTotaux({ totalMaersk_HT: SIMU_MANUT_PU, fraisManutention_HT: SIMU_MANUT_PU }),
    });
    const lines = buildSimuLines(response);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line, i) => expect(line.num).toBe(i + 1));
  });
});
