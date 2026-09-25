import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlertes, markAlerteRead } from '../../api/client';
import { usePagedData } from '../../hooks/usePagedData';
import type { Alerte } from '../../types';
import { AlertTriangle, Bell, CheckCircle2, Clock, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { PAGE_SIZE, ALERT_TYPE_SOUFFRANCE, ALERT_TYPE_CRITICAL } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

export default function AlertesPage() {
  const [tab, setTab]                 = useState<'active' | 'history'>('active');
  const [page, setPage]               = useState(1);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const navigate    = useNavigate();
  const { isAdmin, clientCode, clientName } = useAuth();

  const { data, loading, error, load } = usePagedData<Alerte>(
    () => getAlertes(clientCode, tab === 'history', page, PAGE_SIZE),
    [clientCode, tab, page],
  );

  useEffect(() => {
    if (!clientCode) { navigate(isAdmin ? '/admin' : '/'); return; }
    load();
  }, [clientCode, load]);

  // Reset page when tab changes
  useEffect(() => { setPage(1); }, [tab]);

  const handleDismiss = async (id: number) => {
    setDismissingId(id);
    try {
      await markAlerteRead(id);
      load();
    } catch (e) { console.error('markAlerteRead failed', e); }
    finally { setDismissingId(null); }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const items      = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Per-type counts from current page (for summary strip)
  const souffrance = items.filter(a => a.typeAlerte === ALERT_TYPE_SOUFFRANCE).length;
  const critical   = items.filter(a => a.typeAlerte === ALERT_TYPE_CRITICAL).length;
  const warning    = items.filter(a => a.niveauAlerte === 'WARNING').length;

  if (loading) return <PageSpinner />;
  if (error)   return <div style={{ padding:40 }}><ErrorBanner onRetry={load} /></div>;

  const Pagination = () => totalPages <= 1 ? null : (
    <div className="pagination-row">
      <span className="pagination-info">
        {totalCount} alerte{totalCount > 1 ? 's' : ''} · page {page} / {totalPages}
      </span>
      <div className="pagination-btns">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="pagination-btn"
        >
          <ChevronLeft size={14}/> Préc.
        </button>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="pagination-btn"
        >
          Suiv. <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth:900 }}>

      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-header-left">
          <div className={`page-header-icon ${totalCount > 0 && tab === 'active' ? 'page-header-icon--danger' : 'page-header-icon--success'}`}>
            <Bell size={19} color={totalCount > 0 && tab === 'active' ? '#dc2626' : '#16a34a'} />
          </div>
          <div>
            <h1 className="page-title-sm">Alertes</h1>
            <span className="page-client-label">{clientName || clientCode}</span>
          </div>
        </div>
      </div>

      {/* ── Summary strips (active tab only, current page) ── */}
      {tab === 'active' && items.length > 0 && (
        <div className="alert-strip">
          {souffrance > 0 && (
            <div className="alert-strip-card alert-strip-card--souffrance">
              <AlertTriangle size={18} color="#7c3aed" />
              <div>
                <div className="alert-strip-count" style={{ color:'#7c3aed' }}>{souffrance}</div>
                <div className="alert-strip-label" style={{ color:'#7c3aed' }}>Souffrance · +45 jours</div>
              </div>
            </div>
          )}
          {critical > 0 && (
            <div className="alert-strip-card alert-strip-card--critical">
              <AlertTriangle size={18} color="#dc2626" />
              <div>
                <div className="alert-strip-count" style={{ color:'#dc2626' }}>{critical}</div>
                <div className="alert-strip-label" style={{ color:'#dc2626' }}>Critique{critical>1?'s':''} · 30–44 jours</div>
              </div>
            </div>
          )}
          {warning > 0 && (
            <div className="alert-strip-card alert-strip-card--warning">
              <Clock size={18} color="#d97706" />
              <div>
                <div className="alert-strip-count" style={{ color:'#d97706' }}>{warning}</div>
                <div className="alert-strip-label" style={{ color:'#d97706' }}>Avertissement{warning>1?'s':''} · 15–29 jours</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:'2px solid var(--gray-200)' }}>
        {([
          { key:'active',  label: tab === 'active' ? `Non lues (${totalCount})` : 'Non lues' },
          { key:'history', label: tab === 'history' ? `Historique (${totalCount})` : 'Historique' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding:'9px 16px', fontSize:13, fontWeight:600, border:'none', borderBottom: `2px solid ${tab===t.key ? 'var(--primary)' : 'transparent'}`, marginBottom:'-2px', background:'transparent', cursor:'pointer', color: tab===t.key ? 'var(--primary)' : 'var(--gray-500)', borderRadius:'4px 4px 0 0', transition:'color 0.15s' }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Active alerts ── */}
      {tab === 'active' && (
        items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <CheckCircle2 size={48} color="#86efac" style={{ marginBottom:12 }} />
            <p style={{ fontSize:16, fontWeight:700, color:'var(--gray-700)' }}>Tout est en ordre</p>
            <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:4 }}>Aucune alerte active pour le moment.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {items.map(a => {
                const isSouffrance = a.typeAlerte === ALERT_TYPE_SOUFFRANCE;
                const isCrit = !isSouffrance && a.niveauAlerte === 'CRITICAL';
                const borderColor  = isSouffrance ? '#d8b4fe' : isCrit ? '#fca5a5' : '#fde68a';
                const accentColor  = isSouffrance ? '#7c3aed' : isCrit ? '#dc2626' : '#d97706';
                const bgColor      = isSouffrance ? '#fdf4ff' : isCrit ? '#fef2f2' : '#fffbeb';
                return (
                  <div key={a.alerteId} style={{
                    background:'white', border:`1px solid ${borderColor}`,
                    borderLeft:`4px solid ${accentColor}`,
                    borderRadius:10, padding:'16px 20px',
                    display:'flex', gap:14, alignItems:'flex-start',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ width:36, height:36, borderRadius:9, background: bgColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <AlertTriangle size={17} color={accentColor} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span className={`badge-severity ${isSouffrance ? 'badge-souffrance' : isCrit ? 'badge-critical' : 'badge-warning'}`}>
                          {isSouffrance ? 'SOUFFRANCE' : a.niveauAlerte}
                        </span>
                        <span style={{ fontSize:11, color:'var(--gray-400)' }}>{a.typeAlerte}</span>
                        <span style={{ fontSize:11, color:'var(--gray-400)', marginLeft:'auto' }}>{fmt(a.dateAlerte)}</span>
                      </div>
                      <p style={{ fontSize:14, fontWeight:700, color:'var(--gray-800)', marginBottom: a.message ? 4 : 0 }}>{a.titre}</p>
                      {a.message && <p style={{ fontSize:13, color:'var(--gray-500)', marginBottom:8 }}>{a.message}</p>}
                      <button
                        onClick={() => navigate(`/conteneurs/${a.numeroConteneur}`)}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', border:'1px solid var(--gray-200)', borderRadius:6, background:'var(--gray-50)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'ui-monospace,monospace' }}
                      >
                        {a.numeroConteneur} <ExternalLink size={11}/>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDismiss(a.alerteId)}
                      disabled={dismissingId === a.alerteId}
                      title="Marquer comme lu"
                      className="btn-dismiss"
                    >
                      {dismissingId===a.alerteId ? <Loader2 size={15} className="spin"/> : <CheckCircle2 size={15}/>}
                    </button>
                  </div>
                );
              })}
            </div>
            <Pagination />
          </>
        )
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--gray-400)' }}>
            <p style={{ fontSize:14 }}>Aucune alerte dans l'historique.</p>
          </div>
        ) : (
          <>
            <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--gray-50)', borderBottom:'1px solid var(--gray-200)' }}>
                    {['Niveau','Type','Conteneur','Titre','Date alerte','Lu le'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a, i) => (
                    <tr
                      key={a.alerteId}
                      onClick={() => navigate(`/conteneurs/${a.numeroConteneur}`)}
                      style={{ borderBottom: i < items.length-1 ? '1px solid var(--gray-100)' : 'none', cursor:'pointer', transition:'background 0.1s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--gray-50)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='white')}
                    >
                      <td style={{ padding:'11px 14px' }}>
                        {(() => {
                          const isSouf = a.typeAlerte === ALERT_TYPE_SOUFFRANCE;
                          const isCr   = !isSouf && a.niveauAlerte === 'CRITICAL';
                          return (
                            <span className={`badge-severity ${isSouf ? 'badge-souffrance' : isCr ? 'badge-critical' : 'badge-warning'}`}>
                              {isSouf ? 'SOUFFRANCE' : a.niveauAlerte}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:12 }}>{a.typeAlerte}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'ui-monospace,monospace', fontSize:12, fontWeight:600, color:'var(--gray-700)' }}>{a.numeroConteneur}</td>
                      <td style={{ padding:'11px 14px', color:'var(--gray-700)' }}>{a.titre}</td>
                      <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:12, whiteSpace:'nowrap' }}>{fmt(a.dateAlerte)}</td>
                      <td style={{ padding:'11px 14px', color:'var(--gray-400)', fontSize:12 }}>{a.dateLecture ? fmt(a.dateLecture) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </>
        )
      )}
    </div>
  );
}
