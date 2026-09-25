import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDashboard } from '../../api/client';
import type { DashboardData } from '../../types';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useAuth } from '../../contexts/AuthContext';
import { KpiCards } from './KpiCards';
import { TendanceChart } from './TendanceChart';
import { DonutChart } from './DonutChart';

function DaysBadge({ days }: Readonly<{ days: number }>) {
  const [bg, color, label] =
    days >= 30 ? ['#fef2f2', '#dc2626', `${days}j`] :
    days >= 15 ? ['#fffbeb', '#d97706', `${days}j`] :
                 ['#f0fdf4', '#16a34a', `${days}j`];
  return (
    <span style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:bg, color, fontVariantNumeric:'tabular-nums' }}>
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const params    = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName, clearAuth } = useAuth();
  const clientCode = params.get('clientCode') || authClientCode || '';
  const clientName = params.get('clientName') || authClientName || '';

  useEffect(() => {
    if (!clientCode) {
      if (isAdmin) { navigate('/admin'); } else { clearAuth(); navigate('/'); }
      return;
    }
    setError(false);
    getDashboard(clientCode).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientCode]);

  if (loading) return <PageSpinner />;
  if (error || !data) return (
    <div style={{ padding: 40 }}>
      <ErrorBanner onRetry={() => {
        setLoading(true); setError(false);
        getDashboard(clientCode).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
      }} />
    </div>
  );

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  return (
    <div className="page dashboard-page" style={{ maxWidth:1100 }}>

      {/* ── Welcome header ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero__eyebrow">Tableau de bord</div>
        <h1 className="dashboard-hero__title">{clientName || clientCode}</h1>
      </div>

      {/* ── KPI strip ── */}
      <KpiCards data={data} />

      {/* ── Tendance + donut side by side ── */}
      {data.tendance.length > 0 && (
        <div className="dashboard-panel" style={{ marginBottom: 20 }}>
          <div className="dashboard-panel__header">
            <Package size={14} color="var(--primary)" />
            <span className="dashboard-panel__title">Flux hebdomadaires</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: data.parSite.length > 0 ? '1fr 220px' : '1fr', gap:0, padding:'4px 0 20px' }}>
            <div style={{ padding:'0 20px', borderRight: data.parSite.length > 0 ? '1px solid var(--gray-100)' : 'none' }}>
              <TendanceChart data={data.tendance} />
            </div>
            {data.parSite.length > 0 && (
              <div style={{ padding:'8px 20px 0' }}>
                <DonutChart sites={data.parSite} total={data.totalEnStock} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Immobilisés panel ── */}
      <div>
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <AlertTriangle size={14} color="#d97706" />
            <span className="dashboard-panel__title">Immobilisés les plus anciens</span>
          </div>
          {data.topAnciens.length === 0 ? (
            <div className="dashboard-panel__empty">
              <Package size={32} style={{ opacity:0.2, marginBottom:8 }} />
              <p>Aucun conteneur en stock</p>
            </div>
          ) : (
            <div>
              {data.topAnciens.map((c, i) => (
                <div
                  key={c.numeroConteneur}
                  onClick={() => navigate(`/conteneurs/${c.numeroConteneur}`)}
                  className="dashboard-top-item"
                  style={{ borderBottom: i < data.topAnciens.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--oncf-orange-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="dashboard-top-item__rank">{i + 1}</span>
                  <div className="dashboard-top-item__content">
                    <div style={{ fontFamily:'ui-monospace,monospace', fontWeight:700, fontSize:12, color:'var(--gray-800)' }}>{c.numeroConteneur}</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1 }}>{c.siteLibelle} · entrée le {fmt(c.dateEntree)}</div>
                  </div>
                  <div className="dashboard-top-item__meta">
                    <DaysBadge days={c.nombreJoursStockage} />
                    <ArrowRight size={13} color="var(--gray-300)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
