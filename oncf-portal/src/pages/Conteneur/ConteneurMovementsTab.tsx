import type { Mouvement } from '../../types';
import { Clock } from 'lucide-react';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function movTypeColor(t: string) {
  const u = t.toUpperCase();
  if (u.includes('ENTREE') || u.includes('ARRIVEE')) return { bg: '#dcfce7', color: '#16a34a' };
  if (u.includes('SORTI') || u.includes('DEPART'))   return { bg: '#fef2f2', color: '#dc2626' };
  if (u.includes('ALERTE') || u.includes('AVERTIS'))  return { bg: '#fffbeb', color: '#d97706' };
  return { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
}

export function ConteneurMovementsTab({ mouvements }: Readonly<{ mouvements: Mouvement[] }>) {
  if (mouvements.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Clock size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-600)' }}>Aucun mouvement enregistré</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 10, top: 12, bottom: 12, width: 2, background: 'var(--gray-200)', borderRadius: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mouvements.map((m, i) => {
          const { bg, color } = movTypeColor(m.typeMouvement);
          return (
            <div
              key={m.mouvementId}
              style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px', background: 'white', border: '1px solid var(--gray-100)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', marginBottom: i < mouvements.length - 1 ? 6 : 0 }}
            >
              <div style={{ position: 'absolute', left: -22, top: 18, width: 10, height: 10, borderRadius: '50%', background: bg, border: `2px solid ${color}`, zIndex: 1 }} />
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  {m.typeMouvement}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--gray-700)', margin: 0, lineHeight: 1.4 }}>{m.description || '—'}</p>
                {m.source && (
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3, display: 'block' }}>Source : {m.source}</span>
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{fmt(m.dateMouvement)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
