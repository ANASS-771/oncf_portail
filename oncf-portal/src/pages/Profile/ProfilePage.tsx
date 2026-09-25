import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock3,
  Copy,
  KeyRound,
  Package,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { getMyProfile } from '../../api/client';
import type { CurrentUserProfile } from '../../types';
import PageSpinner from '../../components/ui/PageSpinner';

// ── Shared helpers ───────────────────────────────────────────────────────────

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR') : '—';
}

function initials(profile: CurrentUserProfile) {
  return (profile.nomClient || profile.login || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || 'U';
}

function CopyLoginButton({ login }: Readonly<{ login: string }>) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(login);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };
  return (
    <button type="button" className="btn-back profile-copy-button" onClick={handle}>
      <Copy size={15} />
      {copied ? 'Copié !' : 'Copier le login'}
    </button>
  );
}

// ── Admin profile view ───────────────────────────────────────────────────────

function AdminProfileView({ profile }: Readonly<{ profile: CurrentUserProfile }>) {
  return (
    <div className="page profile-page">

      <div className="page-header profile-header">
        <div>
          <p className="page-header-sub">Compte système</p>
          <h1>Profil Administrateur</h1>
          <p className="page-subtitle">
            Compte de supervision ONCF — accès complet à toutes les fonctionnalités du portail.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="btn-primary profile-action-primary" to="/change-password">
            <KeyRound size={16} /> Changer le mot de passe
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <div className="profile-hero card profile-hero-admin">
        <div className="profile-avatar profile-avatar-admin">
          <ShieldCheck size={28} />
        </div>
        <div className="profile-hero-body">
          <div className="profile-hero-topline">
            <span className="profile-name">Administrateur ONCF</span>
            <span className="badge badge-sync-running">Administrateur</span>
          </div>
          <div className="profile-login">{profile.login}</div>
          <div className="profile-meta-row">
            <span className="profile-pill profile-pill-success">
              <ShieldCheck size={12} /> Accès complet
            </span>
            <span className={profile.isActive
              ? 'profile-pill profile-pill-success'
              : 'profile-pill profile-pill-danger'}>
              {profile.isActive ? 'Compte actif' : 'Compte inactif'}
            </span>
            <span className={profile.mustChangePwd
              ? 'profile-pill profile-pill-warning'
              : 'profile-pill profile-pill-success'}>
              {profile.mustChangePwd ? 'Mot de passe à changer' : 'Mot de passe conforme'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-grid">

        {/* Account info */}
        <section className="profile-card card">
          <div className="profile-card-title"><UserRound size={18} /> Informations du compte</div>
          <dl className="profile-details">
            <div><dt>Login</dt><dd className="font-mono">{profile.login}</dd></div>
            <div><dt>Rôle</dt><dd>Administrateur système</dd></div>
            <div><dt>Créé le</dt><dd>{fmtDate(profile.createdAt)}</dd></div>
            <div><dt>Créé par</dt><dd>{profile.createdBy || '—'}</dd></div>
            <div><dt>Dernière connexion</dt><dd>{fmtDate(profile.lastLogin)}</dd></div>
          </dl>
          <CopyLoginButton login={profile.login} />
        </section>

        {/* Privileges */}
        <section className="profile-card card">
          <div className="profile-card-title"><ShieldCheck size={18} /> Privilèges système</div>
          <div className="profile-privilege-list">
            <div className="profile-privilege-row">
              <BadgeCheck size={15} className="privilege-icon" />
              <span>Gestion des comptes clients</span>
            </div>
            <div className="profile-privilege-row">
              <BadgeCheck size={15} className="privilege-icon" />
              <span>Accès à tous les données logistiques</span>
            </div>
            <div className="profile-privilege-row">
              <BadgeCheck size={15} className="privilege-icon" />
              <span>Supervision des synchronisations de données</span>
            </div>
            <div className="profile-privilege-row">
              <BadgeCheck size={15} className="privilege-icon" />
              <span>Consultation en contexte de n'importe quel client</span>
            </div>
            <div className="profile-privilege-row">
              <BadgeCheck size={15} className="privilege-icon" />
              <span>Réinitialisation des mots de passe</span>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="profile-card card">
          <div className="profile-card-title"><Clock3 size={18} /> Sécurité et statut</div>
          <div className="profile-security-list">
            <div className="profile-security-row">
              <span>Statut du compte</span>
              <strong className={profile.isActive ? 'text-success' : 'text-danger'}>
                {profile.isActive ? 'Actif' : 'Inactif'}
              </strong>
            </div>
            <div className="profile-security-row">
              <span>Mot de passe</span>
              <strong className={profile.mustChangePwd ? 'text-warning' : 'text-success'}>
                {profile.mustChangePwd ? 'À renouveler' : 'Conforme'}
              </strong>
            </div>
            <div className="profile-security-row">
              <span>Compte créé</span>
              <strong>{fmtDate(profile.createdAt)}</strong>
            </div>
            <div className="profile-security-row">
              <span>Dernier accès</span>
              <strong>{fmtDate(profile.lastLogin)}</strong>
            </div>
          </div>
        </section>

        {/* Admin shortcuts */}
        <section className="profile-card card">
          <div className="profile-card-title"><CalendarClock size={18} /> Accès rapides</div>
          <div className="profile-shortcuts">
            <Link className="profile-shortcut" to="/admin">
              <ShieldCheck size={16} /> Dashboard admin
            </Link>
            <Link className="profile-shortcut" to="/admin/users">
              <Settings size={16} /> Gestion utilisateurs
            </Link>
            <Link className="profile-shortcut" to="/admin/clients">
              <Building2 size={16} /> Annuaire clients
            </Link>
            <Link className="profile-shortcut" to="/change-password">
              <KeyRound size={16} /> Changer le mot de passe
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Client profile view ──────────────────────────────────────────────────────

function ClientProfileView({ profile }: Readonly<{ profile: CurrentUserProfile }>) {
  return (
    <div className="page profile-page">

      <div className="page-header profile-header">
        <div>
          <p className="page-header-sub">Compte connecté</p>
          <h1>Mon profil</h1>
          <p className="page-subtitle">
            Informations du compte et activité logistique associée.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="btn-back" to="/dashboard">Retour dashboard</Link>
          <Link className="btn-primary profile-action-primary" to="/change-password">
            <KeyRound size={16} /> Changer le mot de passe
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <div className="profile-hero card">
        <div className="profile-avatar">{initials(profile)}</div>
        <div className="profile-hero-body">
          <div className="profile-hero-topline">
            <span className="profile-name">{profile.nomClient || profile.login}</span>
            <span className="badge badge-sync-idle">Client</span>
          </div>
          <div className="profile-login">{profile.login}</div>
          <div className="profile-meta-row">
            <span className={profile.isActive
              ? 'profile-pill profile-pill-success'
              : 'profile-pill profile-pill-danger'}>
              {profile.isActive ? 'Compte actif' : 'Compte inactif'}
            </span>
            <span className={profile.mustChangePwd
              ? 'profile-pill profile-pill-warning'
              : 'profile-pill profile-pill-success'}>
              {profile.mustChangePwd ? 'Mot de passe à changer' : 'Mot de passe conforme'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-grid">

        {/* Account info */}
        <section className="profile-card card">
          <div className="profile-card-title"><UserRound size={18} /> Informations du compte</div>
          <dl className="profile-details">
            <div><dt>Login</dt><dd className="font-mono">{profile.login}</dd></div>
            <div><dt>ICE / Code client</dt><dd className="font-mono">{profile.clientCode || '—'}</dd></div>
            <div><dt>Raison sociale</dt><dd>{profile.nomClient}</dd></div>
            <div><dt>Compte créé le</dt><dd>{fmtDate(profile.createdAt)}</dd></div>
            <div><dt>Dernière connexion</dt><dd>{fmtDate(profile.lastLogin)}</dd></div>
          </dl>
          <CopyLoginButton login={profile.login} />
        </section>

        {/* Container activity */}
        <section className="profile-card card">
          <div className="profile-card-title"><Package size={18} /> Activité logistique</div>
          <div className="profile-stats-grid">
            <div className="profile-stat">
              <span className="profile-stat-value">
                {profile.enStock.toLocaleString('fr-FR')}
              </span>
              <span className="profile-stat-label">Conteneurs en stock</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {profile.totalConteneurs.toLocaleString('fr-FR')}
              </span>
              <span className="profile-stat-label">Total conteneurs</span>
            </div>
            <div className="profile-stat profile-stat-wide">
              <span className="profile-stat-value">
                {profile.totalConteneurs > 0
                  ? Math.round((profile.enStock / profile.totalConteneurs) * 100)
                  : 0}%
              </span>
              <span className="profile-stat-label">Taux de stock actuel</span>
            </div>
          </div>
          <p className="profile-note">
            Données synchronisées en temps réel depuis les systèmes ONCF.
          </p>
        </section>

        {/* Security */}
        <section className="profile-card card">
          <div className="profile-card-title"><Clock3 size={18} /> Sécurité et statut</div>
          <div className="profile-security-list">
            <div className="profile-security-row">
              <span>Statut du compte</span>
              <strong className={profile.isActive ? 'text-success' : 'text-danger'}>
                {profile.isActive ? 'Actif' : 'Inactif'}
              </strong>
            </div>
            <div className="profile-security-row">
              <span>Mot de passe</span>
              <strong className={profile.mustChangePwd ? 'text-warning' : 'text-success'}>
                {profile.mustChangePwd ? 'À renouveler' : 'Conforme'}
              </strong>
            </div>
            <div className="profile-security-row">
              <span>Compte créé le</span>
              <strong>{fmtDate(profile.createdAt)}</strong>
            </div>
            <div className="profile-security-row">
              <span>Dernier accès</span>
              <strong>{fmtDate(profile.lastLogin)}</strong>
            </div>
          </div>
        </section>

        {/* Client shortcuts */}
        <section className="profile-card card">
          <div className="profile-card-title"><CalendarClock size={18} /> Accès rapides</div>
          <div className="profile-shortcuts">
            <Link className="profile-shortcut" to="/dashboard">
              <BadgeCheck size={16} /> Tableau de bord
            </Link>
            <Link className="profile-shortcut" to="/stock">
              <Package size={16} /> Stock en cours
            </Link>
            <Link className="profile-shortcut" to="/alertes">
              <ShieldCheck size={16} /> Mes alertes
            </Link>
            <Link className="profile-shortcut" to="/change-password">
              <KeyRound size={16} /> Changer le mot de passe
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Root component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    let alive = true;
    getMyProfile()
      .then(data  => { if (alive) setProfile(data); })
      .catch(()   => { if (alive) setError('Impossible de charger le profil.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <PageSpinner />;

  if (error || !profile) {
    return (
      <div className="page profile-page">
        <div className="page-header"><h1>Mon profil</h1></div>
        <div className="profile-shell card">
          <p className="empty-state">{error || 'Profil introuvable.'}</p>
          <button className="btn-back" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return profile.isAdmin
    ? <AdminProfileView profile={profile} />
    : <ClientProfileView profile={profile} />;
}
