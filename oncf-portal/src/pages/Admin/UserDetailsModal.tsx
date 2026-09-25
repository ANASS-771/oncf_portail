import { useNavigate } from 'react-router-dom';
import { FileText, HeadphonesIcon, LayoutDashboard, Package, ShieldCheck, TrendingUp, Users, X } from 'lucide-react';
import type { PortalUser } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function UserDetailsModal({ user, onClose }: Readonly<{ user: PortalUser; onClose: () => void }>) {
  const navigate = useNavigate();
  const { impersonate } = useAuth();

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openAs = (target: '/dashboard' | '/stock' | '/factures' | '/sorties') => {
    impersonate(user.clientCode!, user.nomClient!);
    navigate(`${target}?clientCode=${user.clientCode}&clientName=${encodeURIComponent(user.nomClient!)}`);
  };

  const roleIcon = user.role === 'ADMIN'
    ? <ShieldCheck size={18} />
    : user.role === 'AGENT'
      ? <HeadphonesIcon size={18} />
      : <Users size={18} />;

  const roleIconBg = user.role === 'ADMIN'
    ? { background: 'rgba(26,43,94,0.10)', color: 'var(--oncf-navy)' }
    : user.role === 'AGENT'
      ? { background: '#eef2ff', color: '#4338ca' }
      : { background: 'var(--oncf-orange-bg)', color: 'var(--primary)' };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-panel" style={{ maxWidth: 680 }}>

        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', ...roleIconBg }}>
              {roleIcon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'ui-monospace,monospace' }}>{user.login}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{user.nomClient || 'Compte ONCF'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-modal-grid">

            {/* Left — Identité */}
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 18, background: 'var(--gray-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...roleIconBg }}>
                  {roleIcon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Identité</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'ui-monospace,monospace' }}>{user.login}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--gray-400)' }}>Rôle:</span>{' '}
                  <span style={{ fontWeight: 700, color: user.role === 'ADMIN' ? 'var(--oncf-navy)' : user.role === 'AGENT' ? '#4338ca' : 'var(--gray-700)' }}>
                    {user.role === 'ADMIN' ? 'Administrateur' : user.role === 'AGENT' ? 'Agent ONCF' : 'Client'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-400)' }}>État:</span>{' '}
                  <span style={{ fontWeight: 700, color: user.isActive ? '#16a34a' : '#dc2626' }}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {user.nomClient && (
                  <div><span style={{ color: 'var(--gray-400)' }}>Client:</span> <span>{user.nomClient}</span></div>
                )}
                {user.clientCode && (
                  <div><span style={{ color: 'var(--gray-400)' }}>Code client:</span> <span style={{ fontWeight: 600, fontFamily: 'ui-monospace,monospace' }}>{user.clientCode}</span></div>
                )}
              </div>

              {user.role === 'CLIENT' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {([
                    { target: '/dashboard' as const, icon: <LayoutDashboard size={12} />, label: 'Dashboard' },
                    { target: '/stock'     as const, icon: <Package size={12} />,         label: 'Stock' },
                    { target: '/factures'  as const, icon: <FileText size={12} />,         label: 'Factures' },
                    { target: '/sorties'   as const, icon: <TrendingUp size={12} />,       label: 'Sorties' },
                  ]).map(a => (
                    <button key={a.target} type="button" onClick={() => openAs(a.target)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 8, background: 'white', color: 'var(--gray-600)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                    >
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — stats + account */}
            <div style={{ display: 'grid', gap: 12 }}>
              {user.role === 'CLIENT' && (
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Activité</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--gray-50)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 3 }}>Total conteneurs</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>{user.totalConteneurs.toLocaleString('fr-FR')}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: '#f0fdf4' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 3 }}>En stock</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{user.enStock.toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Compte portail</div>
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div><span style={{ color: 'var(--gray-400)' }}>Créé le:</span> <span>{fmt(user.createdAt)}</span></div>
                  <div><span style={{ color: 'var(--gray-400)' }}>Dernière connexion:</span> <span>{fmt(user.lastLogin)}</span></div>
                  <div>
                    <span style={{ color: 'var(--gray-400)' }}>Mot de passe temporaire:</span>{' '}
                    <span style={{ fontWeight: 600, color: user.mustChangePwd ? '#92400e' : '#16a34a' }}>
                      {user.mustChangePwd ? 'Requis' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="admin-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--gray-200)', borderRadius: 8, background: 'white', color: 'var(--gray-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
