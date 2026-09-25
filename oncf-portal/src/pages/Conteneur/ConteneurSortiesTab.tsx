import type { Sortie } from '../../types';
import { getDocumentPath } from '../../api/client';
import { FileText, Loader2, TruckIcon } from 'lucide-react';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export function ConteneurSortiesTab({
  sorties,
  selectedSortieId,
  pdfKey,
  onDownload,
}: Readonly<{
  sorties: Sortie[];
  selectedSortieId: string | null;
  pdfKey: string | null;
  onDownload: (key: string, path: string, filename: string) => Promise<void>;
}>) {
  if (sorties.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <TruckIcon size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-600)' }}>Aucune sortie enregistrée</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Date sortie', 'Documents', 'Activité', 'État'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorties.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: i < sorties.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  background: selectedSortieId === String(s.id) ? 'var(--oncf-orange-bg)' : 'white',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--oncf-orange-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedSortieId === String(s.id) ? 'var(--oncf-orange-bg)' : 'white')}
              >
                <td style={{ padding: '11px 14px', color: 'var(--gray-600)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(s.dateSortie)}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {s.numBLC && (
                      <button
                        onClick={() => onDownload(`blc-${s.id}`, getDocumentPath('blc', s.id), `BLC_${s.numBLC}.pdf`)}
                        disabled={pdfKey === `blc-${s.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', border: '1px solid var(--primary)', borderRadius: 5, background: 'var(--oncf-orange-bg)', color: 'var(--primary)', fontSize: 11, fontWeight: 600, cursor: pdfKey === `blc-${s.id}` ? 'wait' : 'pointer', opacity: pdfKey === `blc-${s.id}` ? 0.6 : 1 }}
                      >
                        {pdfKey === `blc-${s.id}` ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={11} />}
                        {s.numBLC}
                      </button>
                    )}
                    {s.numBonSortie && (
                      <button
                        onClick={() => onDownload(`bon-${s.id}`, getDocumentPath('bon-sortie', s.id), `BonSortie_${s.numBonSortie}.pdf`)}
                        disabled={pdfKey === `bon-${s.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', border: '1px solid var(--primary)', borderRadius: 5, background: 'var(--oncf-orange-bg)', color: 'var(--primary)', fontSize: 11, fontWeight: 600, cursor: pdfKey === `bon-${s.id}` ? 'wait' : 'pointer', opacity: pdfKey === `bon-${s.id}` ? 0.6 : 1 }}
                      >
                        {pdfKey === `bon-${s.id}` ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={11} />}
                        {s.numBonSortie}
                      </button>
                    )}
                    {!s.numBLC && !s.numBonSortie && <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: '11px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{s.activite || '—'}</td>
                <td style={{ padding: '11px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{s.etatConteneur || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
