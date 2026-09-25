import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Building2,
  Calculator,
  FileText,
  LayoutDashboard,
  LogOut as LogOutIcon,
  Package,
  Search,
  ShieldCheck,
  TruckIcon,
  MessageSquare,
  UserRound,
  Users,
  X,
  HeadphonesIcon,
} from 'lucide-react';
import { getMyProfile, logout } from '../../api/client';
import type { CurrentUserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// ── Nav definitions ───────────────────────────────────────────────────────────

const adminLinks = [
  { to: '/admin',                 label: 'Vue d\'ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/users',           label: 'Utilisateurs',    icon: Users                     },
  { to: '/admin/clients',         label: 'Clients',         icon: Building2                 },
  { to: '/admin/reclamations',    label: 'Réclamations',    icon: MessageSquare             },
];

const clientLinks = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/stock',     label: 'Stock',      icon: Package         },
  { to: '/sorties',   label: 'Sorties',    icon: TruckIcon       },
  { to: '/factures',     label: 'Factures',      icon: FileText     },
  { to: '/simulateur',     label: 'Simulateur Import', icon: Calculator   },
  { to: '/simulateur-hd',  label: 'Simulateur HD',     icon: Calculator   },
  { to: '/alertes',       label: 'Alertes',      icon: Bell           },
  { to: '/reclamations', label: 'Réclamations', icon: MessageSquare  },
  { to: '/search',       label: 'Recherche',    icon: Search         },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NavItem({ to, label, icon: Icon, end = false, onClick }: Readonly<{
  to: string; label: string; icon: React.ElementType; end?: boolean; onClick?: () => void;
}>) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      onClick={onClick}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: Readonly<SidebarProps>) {
  const navigate = useNavigate();
  const { isAdmin, userRole, clientCode, clientName, clearAuth, clearImpersonation } = useAuth();
  const isAgent      = userRole === 'agent';
  const hasClientCtx = Boolean(clientCode);

  // Mode: 'admin' | 'admin-client' | 'agent' | 'client'
  const mode = isAdmin
    ? (hasClientCtx ? 'admin-client' : 'admin')
    : isAgent
    ? 'agent'
    : 'client';

  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(console.error);
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch { /* cookie still cleared on server best-effort */ }
    clearAuth();
    navigate('/');
  };

  const exitClientView = () => {
    clearImpersonation();
    navigate('/admin/clients');
    onClose?.();
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : null;

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>

      {/* Mobile close */}
      {onClose && (
        <button className="sidebar-close" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
      )}

      {/* ── Branding ── */}
      <div className="sidebar-header">
        <img src="/oncf_logo.png" alt="ONCF" className="sidebar-logo" />
      </div>

      {/* ════════════════════════════════════════
          MODE A — Admin pur (pas de client ctx)
          ════════════════════════════════════════ */}
      {mode === 'admin' && (
        <>
          {/* Identity card */}
          <div className="sidebar-context-card sidebar-context-admin">
            <div className="sidebar-context-icon"><ShieldCheck size={18} /></div>
            <div className="sidebar-context-body">
              <div className="sidebar-context-title">Administrateur</div>
              <div className="sidebar-context-sub">ONCF — Accès complet</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-section-label">Administration</span>
            {adminLinks.map(l => (
              <NavItem key={l.to} {...l} onClick={onClose} />
            ))}
          </nav>
        </>
      )}

      {/* ════════════════════════════════════════
          MODE B — Admin consultant un client
          ════════════════════════════════════════ */}
      {mode === 'admin-client' && (
        <>
          {/* Back to admin — prominent escape */}
          <button
            onClick={exitClientView}
            style={{
              display:'flex', alignItems:'center', gap:8,
              margin:'10px 10px 4px', padding:'9px 12px',
              background:'rgba(232,119,34,0.12)', border:'1px solid rgba(232,119,34,0.3)',
              borderRadius:8, cursor:'pointer', width:'calc(100% - 20px)',
              color:'var(--oncf-orange)', fontSize:12, fontWeight:700,
              transition:'background 0.15s',
            }}
          >
            <ArrowLeft size={14} />
            Retour administration
          </button>

          {/* Client banner */}
          <div style={{
            margin:'4px 10px 0', padding:'10px 12px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, flexShrink:0,
          }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'rgba(255,255,255,0.35)', marginBottom:4 }}>
              Vue client
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'white', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {clientName || clientCode}
            </div>
            <div style={{ fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,0.4)', marginTop:2 }}>
              {clientCode}
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-section-label">Données client</span>
            {clientLinks.map(l => (
              <NavItem key={l.to} {...l} onClick={onClose} />
            ))}
          </nav>
        </>
      )}

      {/* ════════════════════════════════════════
          MODE C — Agent ONCF (reclamations)
          ════════════════════════════════════════ */}
      {mode === 'agent' && (
        <>
          <div className="sidebar-context-card sidebar-context-admin">
            <div className="sidebar-context-icon"><HeadphonesIcon size={18} /></div>
            <div className="sidebar-context-body">
              <div className="sidebar-context-title">Agent ONCF</div>
              <div className="sidebar-context-sub">Gestion des réclamations</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-section-label">Mon espace</span>
            <NavItem to="/agent/reclamations" label="Réclamations" icon={MessageSquare} onClick={onClose} />
          </nav>
        </>
      )}

      {/* ════════════════════════════════════════
          MODE D — Utilisateur client normal
          ════════════════════════════════════════ */}
      {mode === 'client' && (
        <>
          {/* Identity card */}
          <div className="sidebar-context-card sidebar-context-client">
            <div className="sidebar-context-icon"><Building2 size={18} /></div>
            <div className="sidebar-context-body">
              <div className="sidebar-context-title">{clientName || clientCode}</div>
              {clientCode && (
                <div className="sidebar-context-sub">{clientCode}</div>
              )}
              {profile && (
                <div className="sidebar-context-stat">
                  {profile.enStock.toLocaleString('fr-FR')} en stock
                  {' / '}
                  {profile.totalConteneurs.toLocaleString('fr-FR')} total
                </div>
              )}
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-section-label">Mon espace</span>
            {clientLinks.map(l => (
              <NavItem key={l.to} {...l} onClick={onClose} />
            ))}
          </nav>
        </>
      )}

      {/* ── Footer (common to all modes) ── */}
      <div className="sidebar-footer">
        <Link to="/profile" className="sidebar-user-row" onClick={onClose}>
          <div className="sidebar-user-avatar">
            {isAdmin ? <ShieldCheck size={15} /> : isAgent ? <HeadphonesIcon size={15} /> : <UserRound size={15} />}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-login">
              {profile?.login ?? (isAdmin ? 'admin' : clientCode)}
            </span>
            {profile?.lastLogin
              ? <span className="sidebar-user-last">Cx : {fmtDate(profile.lastLogin)}</span>
              : <span className="sidebar-user-last">Mon profil</span>
            }
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <LogOutIcon size={16} />
        </button>
      </div>

    </aside>
  );
}
