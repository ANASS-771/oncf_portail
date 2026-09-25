import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShieldCheck, Bell, FileText, Eye, EyeOff, ArrowRight, X, LogIn } from 'lucide-react';
import { login } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const features = [
  { icon: Package, label: 'Suivi en temps réel de vos conteneurs' },
  { icon: ShieldCheck, label: 'Accès sécurisé à vos données' },
  { icon: Bell, label: 'Alertes et notifications automatiques' },
  { icon: FileText, label: 'Gestion des factures et documents' },
];

export default function LoginPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, userRole, setAuth } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;
    navigate(isAdmin ? '/admin' : userRole === 'agent' ? '/agent/reclamations' : '/dashboard', { replace: true });
  }, [isLoggedIn, isAdmin, userRole, navigate]);

  // Autofocus the identifiant field once the panel finishes sliding in.
  useEffect(() => {
    if (!panelOpen) return;
    const t = setTimeout(() => loginInputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [panelOpen]);

  // Close the panel on Escape.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(loginVal.trim(), password);
      // Token is stored in HttpOnly cookie by the server — auth state stored via AuthContext.
      setAuth(data);

      if (data.mustChangePwd) {
        navigate('/change-password');
      } else if (data.isAdmin) {
        navigate('/admin');
      } else if (data.isAgent) {
        navigate('/agent/reclamations');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Identifiants incorrects ou compte inactif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated full-bleed background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-tracks" />
        <div className="login-bg-streak" />
        <div className="login-bg-glow login-bg-glow--1" />
        <div className="login-bg-glow login-bg-glow--2" />
      </div>

      {/* Hero — the portal's pitch */}
      <div className="login-hero">
        <img src="/oncf_logo.png" alt="ONCF" className="login-hero-logo" />
        <span className="login-hero-eyebrow">ONCF · Portail Logistique</span>
        <h1 className="login-hero-title">
          Toute votre chaîne logistique,<br />
          sur <span>un seul portail</span>.
        </h1>
        <p className="login-hero-subtitle">
          Suivi des conteneurs, factures et réclamations en temps réel — pensé
          pour les équipes ONCF et leurs clients.
        </p>
        <ul className="login-hero-chips">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="login-hero-chip">
              <Icon size={14} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating call to action */}
      <button
        type="button"
        className={`login-cta${panelOpen ? ' is-hidden' : ''}`}
        onClick={() => setPanelOpen(true)}
        aria-expanded={panelOpen}
      >
        <LogIn size={17} />
        Se connecter
        <ArrowRight size={16} />
      </button>

      {/* Dimming overlay */}
      <div
        className={`login-overlay${panelOpen ? ' is-open' : ''}`}
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in form panel */}
      <aside
        className={`login-panel${panelOpen ? ' is-open' : ''}`}
        aria-hidden={!panelOpen}
      >
        <button
          type="button"
          className="login-panel-close"
          onClick={() => setPanelOpen(false)}
          aria-label="Fermer"
          tabIndex={panelOpen ? 0 : -1}
        >
          <X size={18} />
        </button>

        <div className="login-panel-badge">
          <LogIn size={22} />
        </div>

        <div className="login-form-header">
          <h2>Connexion</h2>
          <p>Entrez vos identifiants pour accéder à votre espace.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-identifiant">Identifiant (login)</label>
            <input
              id="login-identifiant"
              ref={loginInputRef}
              className="form-input"
              value={loginVal}
              onChange={e => setLoginVal(e.target.value)}
              placeholder="Votre identifiant"
              tabIndex={panelOpen ? 0 : -1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
                tabIndex={panelOpen ? 0 : -1}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', padding: 0 }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn-login" type="submit" disabled={loading} tabIndex={panelOpen ? 0 : -1}>
            {loading ? (
              <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          Problème de connexion ?&nbsp;
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Contactez votre administrateur ONCF.
          </span>
        </p>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          © {new Date().getFullYear()} ONCF — Tous droits réservés
        </p>
      </aside>
    </div>
  );
}
