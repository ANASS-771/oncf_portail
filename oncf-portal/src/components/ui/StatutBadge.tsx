// eslint-disable-next-line react-refresh/only-export-components
export const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS:   'En cours',
  RESOLUE:    'Résolue',
  FERMEE:     'Fermée',
};

// eslint-disable-next-line react-refresh/only-export-components
export const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  EN_ATTENTE: { bg: '#fef3c7', color: '#92400e' },
  EN_COURS:   { bg: '#dbeafe', color: '#1e40af' },
  RESOLUE:    { bg: '#dcfce7', color: '#166534' },
  FERMEE:     { bg: '#f3f4f6', color: '#4b5563' },
};

export function StatutBadge({ statut }: Readonly<{ statut: string }>) {
  const s = STATUT_STYLE[statut] ?? { bg: '#f3f4f6', color: '#4b5563' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, background: s.bg, color: s.color, letterSpacing: '0.3px',
    }}>
      {STATUT_LABEL[statut] ?? statut}
    </span>
  );
}
