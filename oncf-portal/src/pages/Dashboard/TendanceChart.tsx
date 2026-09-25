import { useState } from 'react';
import type { Tendance } from '../../types';

const MONTHS_FR = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];

function isoWeekToMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  return monday;
}

function weekToLabel(s: string): string {
  const m = /^(\d{4})-S(\d{2})$/.exec(s);
  if (!m) return s;
  const d = isoWeekToMonday(+m[1], +m[2]);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export function TendanceChart({ data }: Readonly<{ data: Tendance[] }>) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<4 | 8>(8);

  const W = 600, H = 226;
  const padL = 58, padR = 20, padT = 24, padB = 62;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // API returns newest-first; reverse so time reads left → right, then slice
  const allSorted = [...data].reverse();
  const sorted = weeks === 4 ? allSorted.slice(-4) : allSorted;
  const hasData = sorted.some(d => d.entrees > 0 || d.sorties > 0);

  const maxVal = Math.max(...sorted.flatMap(d => [d.entrees, d.sorties]), 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude || 10;

  const n = sorted.length || 1;
  const groupW = chartW / n;
  const barW = Math.min(Math.floor(groupW * 0.28), 20);
  const barGap = Math.max(Math.floor(barW * 0.3), 3);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f));
  const toH = (v: number) => Math.max((v / niceMax) * chartH, v > 0 ? 3 : 0);
  const toY = (v: number) => padT + chartH - toH(v);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, fontSize:12, color:'var(--gray-600)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:'var(--primary)' }} />
            <span>Entrées</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:'#16a34a' }} />
            <span>Sorties</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {([4, 8] as const).map(w => (
            <button key={w} onClick={() => { setWeeks(w); setHovered(null); }}
              style={{ padding:'4px 12px', fontSize:12, fontWeight:600, border:'1px solid', borderRadius:6, cursor:'pointer',
                borderColor: weeks === w ? 'var(--primary)' : 'var(--gray-200)',
                background:  weeks === w ? 'var(--oncf-orange-bg)' : 'white',
                color:       weeks === w ? 'var(--primary)' : 'var(--gray-500)',
              }}
            >
              {w} sem.
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', fontSize:13 }}>
          Aucune donnée de flux disponible.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width:'100%', display:'block', overflow:'visible' }}
          aria-label="Tendance des flux hebdomadaires"
        >
          {yTicks.map(v => {
            const y = padT + chartH - (v / niceMax) * chartH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                <text x={padL - 8} y={y + 4} fontSize={10} fill="#94a3b8" textAnchor="end" fontFamily="sans-serif">
                  {v}
                </text>
              </g>
            );
          })}

          <text
            x={12} y={padT + chartH / 2}
            fontSize={10} fill="#64748b" textAnchor="middle" fontFamily="sans-serif"
            transform={`rotate(-90, 12, ${padT + chartH / 2})`}
          >
            Conteneurs
          </text>

          <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={1} />

          <text
            x={padL + chartW / 2} y={padT + chartH + 30}
            fontSize={10} fill="#64748b" textAnchor="middle" fontFamily="sans-serif"
          >
            Date (lundi de début de semaine)
          </text>

          {sorted.map((d, i) => {
            const cx = padL + (i + 0.5) * groupW;
            const xE = cx - barGap / 2 - barW;
            const xS = cx + barGap / 2;
            const hE = toH(d.entrees);
            const hS = toH(d.sorties);
            const yE = toY(d.entrees);
            const yS = toY(d.sorties);
            const isHov = hovered === i;
            const dimmed = hovered !== null && !isHov;

            return (
              <g
                key={d.semaine}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                {isHov && (
                  <rect
                    x={padL + i * groupW + 3} y={padT}
                    width={groupW - 6} height={chartH}
                    fill="#f8fafc" rx={4}
                  />
                )}
                {d.entrees > 0 && (
                  <rect x={xE} y={yE} width={barW} height={hE}
                    fill="var(--primary)" rx={3}
                    opacity={dimmed ? 0.22 : 0.88}
                    style={{ transition:'opacity 0.15s' }}
                  />
                )}
                {d.sorties > 0 && (
                  <rect x={xS} y={yS} width={barW} height={hS}
                    fill="#16a34a" rx={3}
                    opacity={dimmed ? 0.22 : 0.88}
                    style={{ transition:'opacity 0.15s' }}
                  />
                )}
                {isHov && d.entrees > 0 && (
                  <text x={xE + barW / 2} y={yE - 5}
                    fontSize={11} fill="var(--primary)" textAnchor="middle"
                    fontWeight={700} fontFamily="sans-serif"
                  >
                    {d.entrees}
                  </text>
                )}
                {isHov && d.sorties > 0 && (
                  <text x={xS + barW / 2} y={yS - 5}
                    fontSize={11} fill="#16a34a" textAnchor="middle"
                    fontWeight={700} fontFamily="sans-serif"
                  >
                    {d.sorties}
                  </text>
                )}
                <text
                  x={cx} y={padT + chartH + 14}
                  fontSize={10}
                  fill={isHov ? 'var(--gray-700)' : '#94a3b8'}
                  textAnchor="middle" fontFamily="sans-serif"
                  fontWeight={isHov ? 700 : 400}
                >
                  {`lun. ${weekToLabel(d.semaine)}`}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
