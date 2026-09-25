import type { FactureLiee } from '../../types';
import { ExternalLink, FileText } from 'lucide-react';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function factureTypeColor(type: string | null) {
  if (!type) return { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
  if (type.toLowerCase().includes('complément')) return { bg: '#eff6ff', color: '#2563eb' };
  return { bg: 'var(--oncf-orange-bg)', color: 'var(--primary)' };
}

export function ConteneurFacturesTab({
  factures,
  onNavigate,
}: Readonly<{
  factures: FactureLiee[];
  onNavigate: (id: number) => void;
}>) {
  if (factures.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <FileText size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-600)' }}>Aucune facture liée</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Numéro', 'Type', 'Période', 'Statut', 'Montant TTC'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Montant TTC' ? 'right' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factures.map((f, i) => {
              const { bg, color } = factureTypeColor(f.typeFacture);
              const isValide = f.statut === 'VALIDEE';
              return (
                <tr
                  key={f.factureId}
                  onClick={() => onNavigate(f.factureId)}
                  style={{ borderBottom: i < factures.length - 1 ? '1px solid var(--gray-100)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--oncf-orange-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 12, color: 'var(--gray-800)' }}>{f.numeroFacture}</span>
                      <ExternalLink size={11} color="var(--gray-300)" />
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {f.typeFacture || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--gray-500)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {f.dateDebutPeriode && f.dateFinPeriode
                      ? `${fmt(f.dateDebutPeriode)} → ${fmt(f.dateFinPeriode)}`
                      : f.dateValidation ? fmt(f.dateValidation) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: isValide ? '#dcfce7' : '#fffbeb', color: isValide ? '#16a34a' : '#d97706', textTransform: 'uppercase' }}>
                      {f.statut}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--gray-900)', fontVariantNumeric: 'tabular-nums' }}>
                    {f.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 3 }}>MAD</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
