import type { SimulateurResponse } from '../../types';
import {
  SIMU_MANUT_PU, SIMU_APM_PU, SIMU_OP_DOC_PU_MAERSK,
  SIMU_OP_DOC_PU_STD, SIMU_REDEVANCE_PU, SIMU_CAMIONNAGE_PU,
} from '../../constants';

export type SimLine = {
  num: number;
  label: string;
  tc: number | null;
  qte: number;
  pu: number;
  ht: number;
  tva: number;
  ttc: number;
  isSurDevis?: boolean;
};

export function buildSimuLines(result: SimulateurResponse): SimLine[] {
  const t = result.totaux;
  const persp = result.perspective ?? 'Admin';
  const clientFinalOps = result.operationsClientFinal ?? [];
  const showMagasinage = persp !== 'DonneurOrdre';
  const showOpFees =
    (persp === 'DonneurOrdre' || persp === 'DonneurOrdreFinal' || persp === 'ClientDirect' || persp === 'Admin')
    && t.totalMaersk_HT > 0;

  const lines: SimLine[] = [];
  let lineNum = 1;

  // Magasinage: aggregate tranches across all containers by designation
  if (showMagasinage && result.conteneurs.length > 0) {
    const trancheMap = new Map<string, { jours: number; pu: number; ht: number; ttc: number }>();
    for (const c of result.conteneurs) {
      for (const tr of c.tranches) {
        const key = tr.designation;
        const existing = trancheMap.get(key);
        if (existing) {
          existing.jours += tr.nombreJours;
          existing.ht    += tr.montantHT;
          existing.ttc   += tr.montantTTC;
        } else {
          trancheMap.set(key, { jours: tr.nombreJours, pu: tr.prixUnitaire, ht: tr.montantHT, ttc: tr.montantTTC });
        }
      }
    }
    for (const [label, v] of trancheMap) {
      lines.push({ num: lineNum++, label, tc: t.nombreConteneurs, qte: v.jours, pu: v.pu, ht: v.ht, tva: v.pu > 0 ? 20 : 0, ttc: v.ttc });
    }
  }

  // Operation fees
  if (showOpFees) {
    // Manutention: 400 MAD/TC flat (entrée 200 + sortie 200), confirmed against real FELog invoices.
    // OpDoc: Maersk = 50 MAD/TC @ TVA exo ; others = 500 MAD/acquit @ 20% (confirmed on 246 DITRALOG invoices).
    const opDocIsMaersk = t.fraisOperationDoc_TauxTVA === 0;
    const opRows = [
      { label: 'Manutention',                                     tc: t.nombreConteneurs, qte: t.nombreUnites,                  pu: SIMU_MANUT_PU,                                                         ht: t.fraisManutention_HT,     tva: t.fraisManutention_TauxTVA },
      { label: 'Manutention APM Terminal Ferroviaire Tanger Med', tc: t.nombreConteneurs, qte: Math.round(t.fraisManutentionAPM_HT / SIMU_APM_PU), pu: SIMU_APM_PU,                                      ht: t.fraisManutentionAPM_HT,  tva: 0 },
      { label: 'Opérations documentaires',                        tc: opDocIsMaersk ? t.nombreConteneurs : null, qte: opDocIsMaersk ? t.nombreConteneurs : t.nombreAcquits, pu: opDocIsMaersk ? SIMU_OP_DOC_PU_MAERSK : SIMU_OP_DOC_PU_STD, ht: t.fraisOperationDoc_HT, tva: t.fraisOperationDoc_TauxTVA },
      { label: 'Scellé',                                          tc: t.nombreConteneurs, qte: t.fraisScelle_NbTC,              pu: t.fraisScelle_NbTC > 0 ? t.fraisScelle_HT / t.fraisScelle_NbTC : 15, ht: t.fraisScelle_HT,          tva: 0 },
      { label: 'Redevance informatique',                          tc: null,               qte: t.nombreAcquits,                  pu: SIMU_REDEVANCE_PU,                                                    ht: t.fraisRedevanceInfo_HT,   tva: 0 },
      { label: 'Camionnage',                                      tc: null,               qte: t.fraisCamionnage_NbAcquits,      pu: SIMU_CAMIONNAGE_PU,                                                   ht: t.fraisCamionnage_HT,      tva: t.fraisCamionnage_TauxTVA },
    ];
    for (const r of opRows) {
      if (r.ht <= 0) continue;
      const ttc = Math.round(r.ht * (1 + r.tva / 100) * 100) / 100;
      lines.push({ num: lineNum++, label: r.label, tc: r.tc, qte: r.qte, pu: r.pu, ht: r.ht, tva: r.tva, ttc });
    }
  }

  // Client-final operations (Pesage, Visite, etc.)
  if (showMagasinage) {
    const seen = new Set<string>();
    for (const op of clientFinalOps) {
      const key = `${op.numeroConteneur}-${op.prestationCode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const label = `${op.designation} — ${op.numeroConteneur}`;
      if (op.isSurDevis) {
        lines.push({ num: lineNum++, label, tc: 1, qte: 0, pu: 0, ht: 0, tva: 20, ttc: 0, isSurDevis: true });
      } else {
        lines.push({ num: lineNum++, label, tc: 1, qte: op.nbOps, pu: op.pu, ht: op.montantHT, tva: op.tauxTVA, ttc: op.montantTTC });
      }
    }
  }

  return lines;
}
