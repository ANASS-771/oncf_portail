import { useNavigate } from 'react-router-dom';
import type { DashboardData } from '../../types';
import { Archive, ArrowRight, Bell, Package, TrendingUp } from 'lucide-react';

export function KpiCards({ data }: Readonly<{ data: DashboardData }>) {
  const navigate = useNavigate();

  const kpis = [
    {
      label: 'En stock',
      value: data.totalEnStock,
      sub: 'conteneurs actuellement',
      icon: <Package size={20} />,
      color: 'var(--primary)',
      bg: 'var(--oncf-orange-bg)',
      border: 'var(--oncf-orange-border)',
      to: '/stock',
    },
    {
      label: 'Total traités',
      value: data.totalConteneurs,
      sub: 'depuis le début',
      icon: <Archive size={20} />,
      color: 'var(--oncf-navy)',
      bg: 'rgba(26,43,94,0.06)',
      border: 'rgba(26,43,94,0.12)',
      to: null,
    },
    {
      label: 'Sorties (30j)',
      value: data.sortiesRecentes,
      sub: 'au cours du dernier mois',
      icon: <TrendingUp size={20} />,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      to: '/sorties',
    },
    {
      label: 'Alertes',
      value: data.alertesNonLues,
      sub: data.alertesNonLues > 0 ? 'nécessitent votre attention' : 'aucune alerte active',
      icon: <Bell size={20} />,
      color: data.alertesNonLues > 0 ? '#dc2626' : '#16a34a',
      bg:    data.alertesNonLues > 0 ? '#fef2f2' : '#f0fdf4',
      border:data.alertesNonLues > 0 ? '#fca5a5' : '#bbf7d0',
      to: '/alertes',
    },
  ];

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map(k => (
        <div
          key={k.label}
          onClick={() => k.to && navigate(k.to)}
          className={`dashboard-kpi-card ${k.to ? 'dashboard-kpi-card--interactive' : ''}`}
          style={{ borderColor: k.border, cursor: k.to ? 'pointer' : 'default' }}
          onMouseEnter={e => { if (k.to) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div className="dashboard-kpi-card__top">
            <div style={{ width:40, height:40, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', color:k.color }}>
              {k.icon}
            </div>
            {k.to && <ArrowRight size={14} color="var(--gray-300)" />}
          </div>
          <div className="dashboard-kpi-card__value" style={{ color:k.color }}>
            {k.value.toLocaleString('fr-FR')}
          </div>
          <div className="dashboard-kpi-card__label">{k.label}</div>
          <div className="dashboard-kpi-card__sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
