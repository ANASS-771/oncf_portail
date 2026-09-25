import { useEffect, useState } from 'react';
import { getJournal, getSyncStatus, forceSyncEntity, getPortalStats } from '../../api/client';
import type { JournalSync, PortalStats, SyncStatus } from '../../types';
import {
  Activity, AlertTriangle, Archive, Building2, CheckCircle2,
  Clock, Database, FileText, MessageSquare, Package, RefreshCw, Users, XCircle, Zap,
} from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import AdminSubNav from '../../components/layout/AdminSubNav';

// ── Status helpers ────────────────────────────────────────────────────────────
function statusColor(s: string) {
  switch (s.toUpperCase()) {
    case 'RUNNING': return '#f59e0b';
    case 'OK':
    case 'IDLE':   return '#16a34a';
    case 'ERROR':  return '#dc2626';
    default:       return '#9ca3af';
  }
}
function StatusDot({ status }: Readonly<{ status: string }>) {
  const color = statusColor(status);
  const spin = status.toUpperCase() === 'RUNNING';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
      {spin
        ? <RefreshCw size={12} color={color} style={{ animation:'spin 1s linear infinite' }} />
        : <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }} />
      }
    </span>
  );
}

// Server stores UTC via GETUTCDATE() but serializes without 'Z' → add it to force UTC parsing.
function utc(iso: string): Date {
  return new Date(/Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z');
}

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - utc(iso).getTime();
  const abs  = Math.abs(diff);
  const min  = Math.floor(abs / 60000);
  const h    = Math.floor(abs / 3600000);
  if (diff < 0) {
    if (min < 1)  return 'dans quelques secondes';
    if (min < 60) return `dans ${min} min`;
    if (h  < 24)  return `dans ${h}h`;
    return utc(iso).toLocaleDateString('fr-FR');
  }
  if (min < 1)  return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  if (h   < 24) return `il y a ${h}h`;
  return utc(iso).toLocaleDateString('fr-FR');
}
function absTime(iso: string | null): string {
  if (!iso) return '—';
  return utc(iso).toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [syncData, setSyncData]       = useState<SyncStatus[]>([]);
  const [journal, setJournal]         = useState<JournalSync[]>([]);
  const [stats, setStats]             = useState<PortalStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [forcingEntity, setForcingEntity] = useState<string | null>(null);
  const [forceMsg, setForceMsg]       = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [sync, jrn, st] = await Promise.all([getSyncStatus(), getJournal(15), getPortalStats()]);
      setSyncData(sync);
      setJournal(jrn);
      setStats(st);
    } catch {
      setError('Impossible de charger le dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleForceSync = async (entity: string) => {
    setForcingEntity(entity);
    setForceMsg(null);
    try {
      const res = await forceSyncEntity(entity);
      setForceMsg(res.message);
      setTimeout(() => { load(true); }, 3000);
    } catch {
      setForceMsg(`Erreur lors du déclenchement de la sync '${entity}'.`);
    } finally {
      setForcingEntity(null);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;

  const hasError     = syncData.some(s => s.lastError);
  const totalTraites = journal.reduce((sum, j) => sum + j.nbTraites, 0);
  const lastSync     = syncData.reduce<string | null>((best, s) =>
    s.lastSuccessfulSync && (!best || s.lastSuccessfulSync > best) ? s.lastSuccessfulSync : best, null);

  const kpis = [
    { label:'Entités sync.', value: syncData.length, icon:<Database size={18}/>, color:'var(--oncf-navy)', bg:'rgba(26,43,94,0.08)' },
    { label:'État global',   value: hasError ? 'Erreurs' : 'Sain',   icon: hasError ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>, color: hasError ? '#dc2626' : '#16a34a', bg: hasError ? '#fef2f2' : '#f0fdf4' },
    { label:'Enreg. traités (24h)', value: totalTraites.toLocaleString('fr-FR'), icon:<Activity size={18}/>, color:'#0ea5e9', bg:'#f0f9ff' },
    { label:'Dernière sync', value: relTime(lastSync), icon:<Clock size={18}/>, color:'var(--primary)', bg:'var(--oncf-orange-bg)' },
  ];

  return (
    <div className="page" style={{ maxWidth:1100 }}>
      <AdminSubNav />

      {/* Page title row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'var(--gray-900)' }}>Vue d'ensemble</h1>
          <p style={{ fontSize:13, color:'var(--gray-500)', marginTop:2 }}>Surveillance en temps réel des synchronisations.</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-700)', fontSize:13, fontWeight:500, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
        >
          <RefreshCw size={14} style={refreshing ? { animation:'spin 1s linear infinite' } : {}} />
          Actualiser
        </button>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--danger-bg)', border:'1px solid #fca5a5', borderRadius:8, marginBottom:20, color:'var(--danger)', fontSize:13 }}>
          <XCircle size={16} /> {error}
        </div>
      )}
      {forceMsg && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, marginBottom:20, color:'#16a34a', fontSize:13 }}>
          <CheckCircle2 size={16} /> {forceMsg}
        </div>
      )}

      {/* KPI strip */}
      <div className="admin-kpi-strip">
        {kpis.map(k => (
          <div key={k.label} style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:k.color }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:k.color, lineHeight:1.1 }}>{k.value}</div>
              <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.3px' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Portal stats strip */}
      {stats && (
        <div className="admin-stats-strip">
          {[
            { label:'Conteneurs total',  value: stats.totalConteneurs.toLocaleString('fr-FR'),    icon:<Archive size={15}/>,      color:'#0ea5e9', bg:'#f0f9ff' },
            { label:'En stock',          value: stats.enStockCount.toLocaleString('fr-FR'),        icon:<Package size={15}/>,      color:'#7c3aed', bg:'#f5f3ff' },
            { label:'Factures',          value: stats.totalFactures.toLocaleString('fr-FR'),       icon:<FileText size={15}/>,     color:'#0891b2', bg:'#ecfeff' },
            { label:'Clients actifs',    value: stats.totalClients.toLocaleString('fr-FR'),        icon:<Building2 size={15}/>,    color:'var(--oncf-navy)', bg:'rgba(26,43,94,0.08)' },
            { label:'Utilisateurs',      value: stats.totalUsersActifs.toLocaleString('fr-FR'),    icon:<Users size={15}/>,        color:'#059669', bg:'#f0fdf4' },
            { label:'Réclamations ouv.', value: stats.reclamationsOuvertes.toLocaleString('fr-FR'), icon:<MessageSquare size={15}/>, color: stats.reclamationsOuvertes > 0 ? '#dc2626' : '#16a34a', bg: stats.reclamationsOuvertes > 0 ? '#fef2f2' : '#f0fdf4' },
          ].map(k => (
            <div key={k.label} style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:k.color }}>
                {k.icon}
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:k.color, lineHeight:1.1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:'var(--gray-500)', marginTop:2, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.3px' }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-col: Sync + Journal */}
      <div className="admin-overview-grid">

        {/* Sync status cards */}
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Synchronisation</span>
            <span style={{ fontSize:12, color:'var(--gray-400)', background:'var(--gray-100)', borderRadius:20, padding:'2px 8px' }}>{syncData.length} entités</span>
          </div>
          {syncData.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Aucune donnée</div>
          ) : (
            <div>
              {syncData.map((s, i) => (
                <div key={s.entityName} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:12, padding:'14px 20px', borderBottom: i < syncData.length - 1 ? '1px solid var(--gray-100)' : 'none', transition:'background 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <StatusDot status={s.status} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--gray-800)' }}>{s.entityName}</div>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1 }}>
                        Sync : {relTime(s.lastSuccessfulSync)}
                        {s.nextScheduledRun && <span style={{ marginLeft:8 }}>· Prochain : {relTime(s.nextScheduledRun)}</span>}
                      </div>
                      {s.lastError && (
                        <div style={{ fontSize:11, color:'var(--danger)', marginTop:3, fontWeight:500 }}>
                          ⚠ {s.lastError.length > 80 ? s.lastError.slice(0, 80) + '…' : s.lastError}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button
                      onClick={() => handleForceSync(s.entityName)}
                      disabled={forcingEntity === s.entityName || s.status.toUpperCase() === 'RUNNING'}
                      title="Forcer la prochaine synchronisation"
                      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 9px', border:'1px solid var(--gray-200)', borderRadius:6, background:'white', color:'var(--gray-500)', fontSize:11, fontWeight:500, cursor: (forcingEntity===s.entityName||s.status.toUpperCase()==='RUNNING') ? 'not-allowed':'pointer', opacity: (forcingEntity===s.entityName||s.status.toUpperCase()==='RUNNING') ? 0.4:1 }}
                    >
                      {forcingEntity===s.entityName
                        ? <RefreshCw size={11} style={{animation:'spin 1s linear infinite'}}/>
                        : <Zap size={11}/>
                      }
                      Force
                    </button>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, letterSpacing:'0.3px',
                      background: s.status.toUpperCase() === 'ERROR' ? '#fef2f2' : s.status.toUpperCase() === 'RUNNING' ? '#fffbeb' : '#f0fdf4',
                      color: statusColor(s.status),
                    }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity journal */}
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--gray-100)' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Activité récente</span>
          </div>
          {journal.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Aucune activité</div>
          ) : (
            <div style={{ maxHeight:440, overflowY:'auto' }}>
              {journal.map(j => {
                const ok = j.statut.toUpperCase() === 'OK' || j.statut.toUpperCase() === 'SUCCESS';
                const running = j.statut.toUpperCase() === 'RUNNING';
                return (
                  <div key={j.journalId} style={{ display:'flex', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--gray-50)', alignItems:'flex-start' }}>
                    <div style={{ marginTop:3, flexShrink:0 }}>
                      {running
                        ? <RefreshCw size={13} color="#f59e0b" style={{ animation:'spin 1s linear infinite' }} />
                        : ok
                          ? <CheckCircle2 size={13} color="#16a34a" />
                          : <XCircle size={13} color="#dc2626" />
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--gray-800)' }}>{j.nomJob}</span>
                        <span style={{ fontSize:11, color:'var(--gray-400)', flexShrink:0, marginLeft:8 }}>{absTime(j.dateDebut)}</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:1 }}>
                        {j.nbTraites > 0 ? `+${j.nbTraites.toLocaleString('fr-FR')} enregistrements` : j.messageErreur ? j.messageErreur.slice(0, 60) + (j.messageErreur.length > 60 ? '…' : '') : 'Aucun traitement'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
