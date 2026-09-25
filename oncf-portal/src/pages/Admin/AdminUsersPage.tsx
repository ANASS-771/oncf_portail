import { useEffect, useState } from 'react';
import { deletePortalUser, getUsers, resetUserPassword, toggleUser } from '../../api/client';
import { PAGE_SIZE } from '../../constants';
import type { PagedResult, PortalUser } from '../../types';
import {
  ChevronLeft, ChevronRight,
  HeadphonesIcon, KeyRound,
  RefreshCw, Search, ShieldCheck, Trash2, UserPlus, X, XCircle,
} from 'lucide-react';
import { useAppFeedback } from '../../components/ui/AppFeedback';
import PageSpinner from '../../components/ui/PageSpinner';
import AdminSubNav from '../../components/layout/AdminSubNav';
import { Avatar } from './Avatar';
import { UserDetailsModal } from './UserDetailsModal';
import { CreateUserModal, copyText } from './CreateUserModal';

export default function AdminUsersPage() {
  const { confirm, notify } = useAppFeedback();
  const [users, setUsers]           = useState<PagedResult<PortalUser> | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [tempPwd, setTempPwd]       = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [showModal, setShowModal]   = useState(false);
  const [detailUser, setDetailUser] = useState<PortalUser | null>(null);
  const pageSize = PAGE_SIZE;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers(page, pageSize, search));
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [page, search]);

  const handleReset = async (clientCode: string, login: string) => {
    const confirmed = await confirm({
      title: 'Réinitialiser le mot de passe',
      message: `Un mot de passe temporaire sera généré pour ${login}.`,
      confirmLabel: 'Réinitialiser',
    });
    if (!confirmed) return;
    setError(null);
    setTempPwd(null);
    try {
      const r = await resetUserPassword(clientCode);
      setTempPwd(r.temporaryPassword);
      notify({ type: 'success', title: 'Mot de passe réinitialisé', message: `Le compte ${login} a reçu un mot de passe temporaire.` });
      load(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notify({ type: 'error', title: 'Réinitialisation impossible', message: msg || "Le mot de passe n'a pas pu être réinitialisé." });
    }
  };

  const handleToggle = async (clientCode: string, login: string, nextActive: boolean) => {
    const confirmed = await confirm({
      title: nextActive ? 'Activer le compte' : 'Désactiver le compte',
      message: `Le compte ${login} sera ${nextActive ? 'activé' : 'désactivé'}.`,
      confirmLabel: nextActive ? 'Activer' : 'Désactiver',
    });
    if (!confirmed) return;
    setError(null);
    try {
      await toggleUser(clientCode, nextActive);
      notify({ type: 'success', title: 'Compte mis à jour', message: `Le compte ${login} est maintenant ${nextActive ? 'actif' : 'inactif'}.` });
      load(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notify({ type: 'error', title: 'Mise à jour impossible', message: msg || "Le statut du compte n'a pas pu être modifié." });
    }
  };

  const handleDelete = async (clientCode: string, login: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le compte portail',
      message: `Cette action supprimera définitivement le compte ${login}.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    setError(null);
    try {
      await deletePortalUser(clientCode);
      notify({ type: 'success', title: 'Compte supprimé', message: `Le compte ${login} a été supprimé du portail.` });
      load(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notify({ type: 'error', title: 'Suppression impossible', message: msg || "Le compte n'a pas pu être supprimé." });
    }
  };

  const totalPages = users ? Math.ceil(users.totalCount / pageSize) : 0;

  if (loading) return <PageSpinner />;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <AdminSubNav />

      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>Utilisateurs</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            {users ? `${users.totalCount.toLocaleString('fr-FR')} comptes enregistrés` : '—'}
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={() => load(true)} disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--gray-200)', borderRadius: 8, background: 'white', color: 'var(--gray-600)', fontSize: 13, fontWeight: 500, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            Actualiser
          </button>
          <button
            onClick={() => { setError(null); setTempPwd(null); setShowModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <UserPlus size={14} /> Créer un compte
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><XCircle size={15} />{error}</div>
          <button onClick={() => setError(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
        </div>
      )}
      {tempPwd && (
        <div className="admin-temp-password">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', marginBottom: 3 }}>Mot de passe temporaire généré</div>
            <code style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1px', color: '#92400e', fontFamily: 'ui-monospace,monospace' }}>{tempPwd}</code>
          </div>
          <button
            onClick={async () => { await copyText(tempPwd); notify({ type: 'success', title: 'Copié', message: 'Le mot de passe temporaire a été copié.' }); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#854d0e', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Copier
          </button>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-toolbar">
          <div className="admin-search">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Filtrer par login, client ou nom…"
              style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 13, border: '1px solid var(--gray-200)', borderRadius: 7, outline: 'none', color: 'var(--gray-800)', background: 'var(--gray-50)' }}
            />
          </div>
        </div>

        <div className="admin-table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                {['Compte', 'Client', 'Conteneurs', 'Rôle', 'État', 'Dernière connexion', ''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Conteneurs' ? 'right' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users?.items.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar login={u.login} role={u.role} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontFamily: 'ui-monospace,monospace', fontSize: 12 }}>{u.login}</div>
                        {u.mustChangePwd && <div style={{ fontSize: 10, color: '#92400e', background: '#fef3c7', borderRadius: 3, padding: '1px 5px', marginTop: 2, display: 'inline-block' }}>Doit changer le mdp</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 600, fontSize: 12, color: 'var(--gray-700)' }}>{u.clientCode || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>{u.nomClient || 'Compte ONCF'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'ui-monospace,monospace', color: 'var(--gray-700)' }}>
                    {u.totalConteneurs.toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: u.role === 'ADMIN' ? 'rgba(26,43,94,0.08)' : u.role === 'AGENT' ? '#eef2ff' : 'var(--gray-100)',
                      color: u.role === 'ADMIN' ? 'var(--oncf-navy)' : u.role === 'AGENT' ? '#4338ca' : 'var(--gray-600)',
                    }}>
                      {u.role === 'ADMIN' && <ShieldCheck size={11} />}
                      {u.role === 'AGENT' && <HeadphonesIcon size={11} />}
                      {u.role === 'ADMIN' ? 'Admin' : u.role === 'AGENT' ? 'Agent' : 'Client'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: u.isActive ? '#f0fdf4' : '#fef2f2', color: u.isActive ? '#16a34a' : '#dc2626' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? '#16a34a' : '#dc2626', display: 'inline-block' }} />
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--gray-500)', fontSize: 12 }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="admin-actions">
                      <button
                        onClick={() => setDetailUser(u)}
                        title="Voir les détails"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid var(--oncf-orange-border)', borderRadius: 6, background: 'var(--oncf-orange-bg)', color: 'var(--primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        Détails
                      </button>
                      {u.role !== 'ADMIN' && (() => {
                        const uid = u.clientCode ?? u.login;
                        return (<>
                          <button
                            onClick={() => handleReset(uid, u.login)}
                            title="Réinitialiser le mot de passe"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid var(--gray-200)', borderRadius: 6, background: 'white', color: 'var(--gray-600)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            <KeyRound size={12} /> Reset
                          </button>
                          <button
                            onClick={() => handleToggle(uid, u.login, !u.isActive)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                              borderColor: u.isActive ? '#fca5a5' : '#86efac',
                              background: u.isActive ? '#fef2f2' : '#f0fdf4',
                              color: u.isActive ? 'var(--danger)' : 'var(--success)',
                            }}
                          >
                            {u.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            onClick={() => handleDelete(uid, u.login)}
                            title="Supprimer le compte portail"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', color: 'var(--danger)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </>);
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
              {(users?.items.length ?? 0) === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Aucun compte trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Page {page} sur {totalPages}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', color: 'var(--gray-600)', fontSize: 12, fontWeight: 500, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={13} /> Précédent
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', color: 'var(--gray-600)', fontSize: 12, fontWeight: 500, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                Suivant <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailUser && (
        <UserDetailsModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={(msg) => { notify({ type: 'success', title: 'Compte créé', message: msg }); load(true); }}
        />
      )}
    </div>
  );
}
