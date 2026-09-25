import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deletePortalUser, getClientDetails, getClients } from '../../api/client';
import { PAGE_SIZE } from '../../constants';
import type { ClientAdminDetails, ClientSummary, PagedResult } from '../../types';
import {
  Building2, ChevronLeft, ChevronRight,
  Database, FileText, LayoutDashboard, Package, RefreshCw,
  Search, Trash2, TrendingUp, X, XCircle,
} from 'lucide-react';
import { useAppFeedback } from '../../components/ui/AppFeedback';
import PageSpinner from '../../components/ui/PageSpinner';
import AdminSubNav from '../../components/layout/AdminSubNav';
import { useAuth } from '../../contexts/AuthContext';

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClientDetailsModal({
  detail,
  loading,
  error,
  deleting,
  onClose,
  onDelete,
  onOpenAs,
}: Readonly<{
  detail: ClientAdminDetails | null;
  loading: boolean;
  error: string | null;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
  onOpenAs: (target: '/dashboard' | '/stock' | '/factures' | '/sorties') => void;
}>) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-panel">
        <div className="admin-modal-header">
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--gray-900)' }}>Données client</div>
            <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>{detail ? `${detail.clientCode} · ${detail.nomClient}` : 'Chargement…'}</div>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'var(--gray-100)', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-500)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="admin-modal-body">
          {loading && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:260 }}>
              <PageSpinner />
            </div>
          )}

          {!loading && error && (
            <div style={{ padding:'12px 14px', border:'1px solid #fca5a5', borderRadius:10, background:'var(--danger-bg)', color:'var(--danger)', fontSize:13 }}>
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <div className="admin-modal-grid">
              <div style={{ border:'1px solid var(--gray-200)', borderRadius:12, padding:18, background:'var(--gray-50)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:'var(--oncf-orange-bg)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)' }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700 }}>Identité</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--gray-900)' }}>{detail.nomClient}</div>
                  </div>
                </div>

                <div style={{ display:'grid', gap:10, fontSize:13 }}>
                  <div><span style={{ color:'var(--gray-400)' }}>Code client:</span> <span style={{ fontWeight:600, fontFamily:'ui-monospace,monospace' }}>{detail.clientCode}</span></div>
                  <div><span style={{ color:'var(--gray-400)' }}>Adresse:</span> <span>{detail.adresse || '—'}</span></div>
                  <div><span style={{ color:'var(--gray-400)' }}>Ville:</span> <span>{detail.ville || '—'}</span></div>
                  <div><span style={{ color:'var(--gray-400)' }}>Statut client:</span> <span style={{ color: detail.estActif ? '#16a34a' : '#dc2626', fontWeight:700 }}>{detail.estActif ? 'Actif' : 'Inactif'}</span></div>
                </div>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:18 }}>
                  {([
                    { target:'/dashboard' as const, label:'Dashboard', icon:<LayoutDashboard size={12} /> },
                    { target:'/stock' as const, label:'Stock', icon:<Package size={12} /> },
                    { target:'/factures' as const, label:'Factures', icon:<FileText size={12} /> },
                    { target:'/sorties' as const, label:'Sorties', icon:<TrendingUp size={12} /> },
                  ]).map(item => (
                    <button
                      key={item.target}
                      type="button"
                      onClick={() => onOpenAs(item.target)}
                      style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 10px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-600)', fontSize:12, fontWeight:500, cursor:'pointer' }}
                    >
                      {item.icon}{item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gap:12 }}>
                <div style={{ border:'1px solid var(--gray-200)', borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Activité client</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
                    <div style={{ padding:12, borderRadius:10, background:'var(--gray-50)' }}>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:3 }}>Total conteneurs</div>
                      <div style={{ fontSize:20, fontWeight:800, color:'var(--gray-900)' }}>{detail.totalConteneurs.toLocaleString('fr-FR')}</div>
                    </div>
                    <div style={{ padding:12, borderRadius:10, background:'var(--gray-50)' }}>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:3 }}>En stock</div>
                      <div style={{ fontSize:20, fontWeight:800, color:'#16a34a' }}>{detail.enStock.toLocaleString('fr-FR')}</div>
                    </div>
                    <div style={{ padding:12, borderRadius:10, background:'var(--gray-50)' }}>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:3 }}>Première entrée</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-800)' }}>{formatDateTime(detail.premierEntree)}</div>
                    </div>
                    <div style={{ padding:12, borderRadius:10, background:'var(--gray-50)' }}>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:3 }}>Dernière entrée</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-800)' }}>{formatDateTime(detail.dernierEntree)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ border:'1px solid var(--gray-200)', borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Compte portail</div>
                  {detail.hasPortalAccount ? (
                    <div style={{ display:'grid', gap:10, fontSize:13 }}>
                      <div><span style={{ color:'var(--gray-400)' }}>Login:</span> <span style={{ fontWeight:700 }}>{detail.portalLogin}</span></div>
                      <div><span style={{ color:'var(--gray-400)' }}>État:</span> <span style={{ color: detail.portalIsActive ? '#16a34a' : '#dc2626', fontWeight:700 }}>{detail.portalIsActive ? 'Actif' : 'Désactivé'}</span></div>
                      <div><span style={{ color:'var(--gray-400)' }}>Mot de passe temporaire requis:</span> <span style={{ fontWeight:600 }}>{detail.portalMustChangePwd ? 'Oui' : 'Non'}</span></div>
                      <div><span style={{ color:'var(--gray-400)' }}>Créé le:</span> <span>{formatDateTime(detail.portalCreatedAt)}</span></div>
                      <div><span style={{ color:'var(--gray-400)' }}>Dernière connexion:</span> <span>{formatDateTime(detail.portalLastLogin)}</span></div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--gray-500)', fontSize:13 }}>
                      <XCircle size={14} /> Aucun compte portail n'est associé à ce client.
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ padding:'10px 12px', border:'1px solid #fca5a5', borderRadius:10, background:'var(--danger-bg)', color:'var(--danger)', fontSize:13 }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <div style={{ fontSize:12, color:'var(--gray-500)' }}>
            {detail?.hasPortalAccount ? 'Vous pouvez supprimer le compte portail de ce client.' : 'Aucun compte portail à supprimer.'}
          </div>
          <div className="admin-modal-footer-actions">
            <button type="button" onClick={onClose} style={{ padding:'8px 14px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-700)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Fermer
            </button>
            {detail?.hasPortalAccount && (
              <button
                type="button"
                disabled={deleting}
                onClick={onDelete}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', border:'none', borderRadius:8, background:'#dc2626', color:'white', fontSize:13, fontWeight:600, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                <Trash2 size={14} />
                {deleting ? 'Suppression…' : 'Supprimer le compte portail'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const { confirm, notify } = useAppFeedback();
  const { impersonate } = useAuth();
  const [clients, setClients] = useState<PagedResult<ClientSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClientCode, setSelectedClientCode] = useState<string | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<ClientAdminDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const pageSize = PAGE_SIZE;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      setClients(await getClients(page, pageSize, search));
    } catch {
      setError('Impossible de charger la liste des clients.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [page, search]);

  const openAs = (client: ClientSummary, target: '/dashboard' | '/stock' | '/factures' | '/sorties') => {
    impersonate(client.clientCode, client.nomClient);
    navigate(`${target}?clientCode=${client.clientCode}&clientName=${encodeURIComponent(client.nomClient)}`);
  };

  const openDetails = async (client: ClientSummary) => {
    setSelectedClientCode(client.clientCode);
    setSelectedClientDetails(null);
    setDetailsError(null);
    setDeletingAccount(false);
    setDetailsLoading(true);
    try {
      setSelectedClientDetails(await getClientDetails(client.clientCode));
    } catch {
      setDetailsError('Impossible de charger les données du client.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const reloadSelectedDetails = async (clientCode: string) => {
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      setSelectedClientDetails(await getClientDetails(clientCode));
    } catch {
      setDetailsError('Impossible de recharger les données du client.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedClientCode(null);
    setSelectedClientDetails(null);
    setDetailsError(null);
    setDetailsLoading(false);
    setDeletingAccount(false);
  };

  const handleDeleteAccount = async () => {
    if (!selectedClientDetails) return;
    const confirmed = await confirm({
      title: 'Supprimer le compte portail',
      message: `Le compte portail associé au client ${selectedClientDetails.clientCode} sera supprimé.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeletingAccount(true);
    setDetailsError(null);
    try {
      await deletePortalUser(selectedClientDetails.clientCode);
      await reloadSelectedDetails(selectedClientDetails.clientCode);
      notify({ type:'success', title:'Compte supprimé', message:`Le compte portail du client ${selectedClientDetails.clientCode} a été supprimé.` });
    } catch {
      setDetailsError('Suppression impossible.');
      notify({ type:'error', title:'Suppression impossible', message:`Le compte portail du client ${selectedClientDetails.clientCode} n’a pas pu être supprimé.` });
    } finally {
      setDeletingAccount(false);
    }
  };

  const totalPages = clients ? Math.ceil(clients.totalCount / pageSize) : 0;

  if (loading) return <PageSpinner />;

  return (
    <div className="page" style={{ maxWidth:1100 }}>
      <AdminSubNav />

      <div className="admin-header">
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'var(--gray-900)' }}>Annuaire clients</h1>
          <p style={{ fontSize:13, color:'var(--gray-500)', marginTop:2 }}>
            {clients ? `${clients.totalCount.toLocaleString('fr-FR')} clients · triés par volume de conteneurs` : '—'}
          </p>
        </div>
        <div className="admin-header-actions">
        <button
          onClick={() => load(true)} disabled={refreshing}
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-600)', fontSize:13, fontWeight:500, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
        >
          <RefreshCw size={14} style={refreshing ? { animation:'spin 1s linear infinite' } : {}} />
          Actualiser
        </button>
        </div>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--danger-bg)', border:'1px solid #fca5a5', borderRadius:8, marginBottom:16, color:'var(--danger)', fontSize:13 }}>
          <XCircle size={15} /> {error}
        </div>
      )}

      {selectedClientCode && (
        <ClientDetailsModal
          detail={selectedClientDetails}
          loading={detailsLoading}
          error={detailsError}
          deleting={deletingAccount}
          onClose={closeDetails}
          onDelete={handleDeleteAccount}
          onOpenAs={(target) => {
            if (selectedClientDetails) {
              openAs(
                {
                  clientCode: selectedClientDetails.clientCode,
                  nomClient: selectedClientDetails.nomClient,
                  totalConteneurs: selectedClientDetails.totalConteneurs,
                  enStock: selectedClientDetails.enStock,
                  premierEntree: selectedClientDetails.premierEntree,
                  dernierEntree: selectedClientDetails.dernierEntree,
                },
                target,
              );
            }
          }}
        />
      )}

      <div className="admin-card">
        <div className="admin-card-toolbar">
          <div className="admin-search">
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par code ou nom de client…"
              style={{ width:'100%', paddingLeft:32, paddingRight:10, paddingTop:7, paddingBottom:7, fontSize:13, border:'1px solid var(--gray-200)', borderRadius:7, outline:'none', color:'var(--gray-800)', background:'var(--gray-50)' }}
            />
          </div>
        </div>

        <div className="admin-table-scroll">
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--gray-200)', background:'var(--gray-50)' }}>
                <th style={{ padding:'9px 14px', width:48, fontSize:11, fontWeight:700, color:'var(--gray-400)', textAlign:'center' }}>#</th>
                <th style={{ padding:'9px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left' }}>Client</th>
                <th style={{ padding:'9px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'right' }}>Total</th>
                <th style={{ padding:'9px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'right' }}>En stock</th>
                <th style={{ padding:'9px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)' }}>Dernière entrée</th>
                <th style={{ padding:'9px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)' }}>Accès rapide</th>
              </tr>
            </thead>
            <tbody>
              {clients?.items.map((c, i) => {
                const rank = (page - 1) * pageSize + i + 1;
                return (
                  <tr
                    key={c.clientCode}
                    style={{ borderBottom:'1px solid var(--gray-100)', transition:'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding:'12px 14px', textAlign:'center', color:'var(--gray-400)', fontSize:12, fontWeight:600 }}>{rank}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:'var(--oncf-orange-bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Building2 size={15} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:12, fontFamily:'ui-monospace,monospace', color:'var(--gray-800)' }}>{c.clientCode}</div>
                          <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:1 }}>{c.nomClient}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontWeight:600, color:'var(--gray-800)' }}>
                      {c.totalConteneurs.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right' }}>
                      {c.enStock > 0
                        ? <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600, color:'#16a34a', background:'#f0fdf4', padding:'2px 8px', borderRadius:6, fontSize:12 }}>{c.enStock.toLocaleString('fr-FR')}</span>
                        : <span style={{ color:'var(--gray-300)', fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:'12px 14px', color:'var(--gray-500)', fontSize:12 }}>
                      {c.dernierEntree ? new Date(c.dernierEntree).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {([
                          { target:'details' as const, icon:<Database size={12} />, label:'Données' },
                          { target:'/dashboard' as const, icon:<LayoutDashboard size={12} />, label:'Dashboard' },
                          { target:'/stock' as const, icon:<Package size={12} />, label:'Stock' },
                          { target:'/factures' as const, icon:<FileText size={12} />, label:'Factures' },
                          { target:'/sorties' as const, icon:<TrendingUp size={12} />, label:'Sorties' },
                        ]).map(a => (
                          <button
                            key={a.target}
                            type="button"
                            onClick={() => a.target === 'details' ? void openDetails(c) : openAs(c, a.target)}
                            title={a.label}
                            style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 9px', border:'1px solid var(--gray-200)', borderRadius:6, background:'white', color:'var(--gray-600)', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.1s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--oncf-orange-bg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-600)'; e.currentTarget.style.background = 'white'; }}
                          >
                            {a.icon}{a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(clients?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding:40, textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Aucun client trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
            <span style={{ fontSize:12, color:'var(--gray-500)' }}>Page {page} sur {totalPages} · {clients?.totalCount.toLocaleString('fr-FR')} clients</span>
            <div style={{ display:'flex', gap:4 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, fontWeight:500, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={13} /> Précédent
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, fontWeight:500, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                Suivant <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
