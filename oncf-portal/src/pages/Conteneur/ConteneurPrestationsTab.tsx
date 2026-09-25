import type { ConteneurOperation } from '../../types';
import { Package } from 'lucide-react';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const PRESTATION_LABELS: Record<number, string> = {
  2:    'Bachage',
  3:    'Camionnage hors périmètre urbain',
  6:    'Bâches appartenant à l\'expéditeur',
  9:    'Utilisation sauterelle',
  14:   'Pesage',
  16:   'Comptage',
  18:   'Manutention',
  22:   'Magasinage',
  24:   'Camionnage',
  25:   'Camionnage tiers',
  26:   'Taxe ad valorem',
  28:   'Accomplissement formalités douane',
  55:   'Stationnement',
  93:   'Passage scanner',
  94:   'Scellé',
  95:   'Redevance informatique',
  96:   'Opérations documentaires',
  97:   'Annulation acquit',
  98:   'Cleaning',
  99:   'PTI',
  100:  'Réparation',
  101:  'Droit de passage terminal ferroviaire',
  102:  'État de chargement',
  103:  'Mise à disposition de conteneur',
  104:  'Visite douanière',
  105:  'Contentieux douane',
  106:  'Nettoyage',
  107:  'Test PTI',
  108:  'Scanner',
  109:  'Transport routier',
  110:  'Prestations logistiques',
  111:  'Cartons',
  112:  'Stockage véhicule',
  113:  'Palette',
  114:  'Transport TC (vide)',
  115:  'Transport big bag',
  116:  'Visite douanière partielle',
  117:  'Visite douanière intégrale',
  7871: 'Transport ferroviaire',
};

export function ConteneurPrestationsTab({ operations }: Readonly<{ operations: ConteneurOperation[] }>) {
  if (operations.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Package size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-600)' }}>Aucune prestation enregistrée</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Prestation', 'Code', 'Facturable', 'Date'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operations.map((op, i) => {
              const label = PRESTATION_LABELS[op.prestationCode];
              return (
                <tr key={i} style={{ borderBottom: i < operations.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>
                    {label
                      ? <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>{label}</span>
                      : <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--gray-500)' }}>{op.prestationCode}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {op.facturable
                      ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#f0fdf4', color: '#16a34a' }}>Oui</span>
                      : <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>Non</span>}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(op.operationDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
