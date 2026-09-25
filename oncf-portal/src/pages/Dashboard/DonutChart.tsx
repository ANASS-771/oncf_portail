import { useState } from 'react';
import type { SiteStock } from '../../types';

const SITE_COLORS = [
  'var(--primary)',
  'var(--oncf-navy)',
  '#16a34a',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#d97706',
];

export function DonutChart({ sites, total }: Readonly<{ sites: SiteStock[]; total: number }>) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const R = 68, r = 42, cx = 88, cy = 88;
  const size = 176;

  let cumAngle = -Math.PI / 2;
  const segments = sites.map((s, i) => {
    const pct = s.quantite / (total || 1);
    const start = cumAngle;
    cumAngle += pct * 2 * Math.PI;
    return { ...s, start, end: cumAngle, pct, color: SITE_COLORS[i % SITE_COLORS.length] };
  });

  const arc = (start: number, end: number, outerR: number, innerR: number) => {
    const large = end - start > Math.PI ? 1 : 0;
    const cos = Math.cos, sin = Math.sin;
    return [
      `M ${cx + outerR * cos(start)} ${cy + outerR * sin(start)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${cx + outerR * cos(end)} ${cy + outerR * sin(end)}`,
      `L ${cx + innerR * cos(end)} ${cy + innerR * sin(end)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * cos(start)} ${cy + innerR * sin(start)}`,
      'Z',
    ].join(' ');
  };

  const active = selected ?? hovered;
  const activeSeg = active !== null ? segments[active] : null;

  const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + '…' : s;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
        Stock par site
      </div>

      <svg viewBox={`0 0 ${size} ${size}`} style={{ width:'100%', maxWidth:160, cursor:'pointer' }}>
        {segments.map((seg, i) => {
          const mid = (seg.start + seg.end) / 2;
          const isActive = active === i;
          const tx = isActive ? Math.cos(mid) * 6 : 0;
          const ty = isActive ? Math.sin(mid) * 6 : 0;
          const commonProps = {
            key: seg.siteLibelle,
            fill: seg.color,
            opacity: active === null || isActive ? 1 : 0.3,
            style: { transform: `translate(${tx}px, ${ty}px)`, transition: 'transform 0.15s, opacity 0.15s', cursor: 'pointer' as const },
            onMouseEnter: () => { if (selected === null) setHovered(i); },
            onMouseLeave: () => { if (selected === null) setHovered(null); },
            onClick: () => setSelected(selected === i ? null : i),
          };
          if (seg.pct >= 1) {
            return (
              <g {...commonProps}>
                <circle cx={cx} cy={cy} r={R} fill={seg.color}
                  opacity={commonProps.opacity}
                  style={commonProps.style}
                  onMouseEnter={commonProps.onMouseEnter}
                  onMouseLeave={commonProps.onMouseLeave}
                  onClick={commonProps.onClick}
                />
                <circle cx={cx} cy={cy} r={r} fill="white" />
              </g>
            );
          }
          return (
            <path {...commonProps} d={arc(seg.start, seg.end, R, r)} />
          );
        })}

        {activeSeg ? (
          <>
            <text x={cx} y={cy - 14} fontSize={9} fill={activeSeg.color}
              textAnchor="middle" fontFamily="sans-serif" fontWeight={700}>
              {truncate(activeSeg.siteLibelle, 12)}
            </text>
            <text x={cx} y={cy + 6} fontSize={19} fontWeight={800} fill="var(--gray-900)"
              textAnchor="middle" fontFamily="sans-serif">
              {activeSeg.quantite.toLocaleString('fr-FR')}
            </text>
            <text x={cx} y={cy + 20} fontSize={10} fill="#94a3b8"
              textAnchor="middle" fontFamily="sans-serif">
              conteneurs
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 7} fontSize={17} fontWeight={800} fill="var(--gray-900)"
              textAnchor="middle" fontFamily="sans-serif">
              {total.toLocaleString('fr-FR')}
            </text>
            <text x={cx} y={cy + 11} fontSize={10} fill="#94a3b8"
              textAnchor="middle" fontFamily="sans-serif">
              conteneurs
            </text>
          </>
        )}
      </svg>

      {selected !== null && (
        <button
          onClick={() => setSelected(null)}
          style={{ fontSize:10, color:'var(--gray-400)', background:'none', border:'none',
            cursor:'pointer', padding:0, textDecoration:'underline' }}
        >
          Réinitialiser
        </button>
      )}

      <div style={{ display:'grid', gap:5, width:'100%' }}>
        {segments.map((seg, i) => (
          <div key={seg.siteLibelle}
            style={{ display:'flex', alignItems:'center', gap:7,
              opacity: active === null || active === i ? 1 : 0.3,
              transition:'opacity 0.15s', cursor:'pointer' }}
            onMouseEnter={() => { if (selected === null) setHovered(i); }}
            onMouseLeave={() => { if (selected === null) setHovered(null); }}
            onClick={() => setSelected(selected === i ? null : i)}
          >
            <div style={{ width:10, height:10, borderRadius:2, background:seg.color, flexShrink:0,
              outline: selected === i ? `2px solid ${seg.color}` : 'none', outlineOffset:1 }} />
            <span style={{ fontSize:11, color:'var(--gray-700)', flex:1,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              fontWeight: selected === i ? 700 : 400 }}>
              {seg.siteLibelle}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color: selected === i ? seg.color : 'var(--gray-500)',
              fontVariantNumeric:'tabular-nums', flexShrink:0 }}>
              {selected === i ? seg.quantite.toLocaleString('fr-FR') : `${Math.round(seg.pct * 100)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
