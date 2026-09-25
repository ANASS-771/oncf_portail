import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Le mot de passe doit contenir au moins une lettre majuscule.');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError('Le mot de passe doit contenir au moins un chiffre.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      // New token set as HttpOnly cookie by server; just navigate.
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch {
      setError('Mot de passe actuel incorrect ou modification impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ justifyContent: 'center', background: 'var(--oncf-navy)' }}>
      <div className="login-right" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: 460 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--oncf-orange-bg)', border: '2px solid var(--oncf-orange-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <KeyRound size={24} color="var(--oncf-orange)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--oncf-navy)', marginBottom: 6 }}>
            Changement de mot de passe
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>
            Modification obligatoire avant d'accéder au portail.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mot de passe actuel</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                style={{ paddingRight: 40 }}
                autoFocus
                required
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', padding: 0 }} tabIndex={-1}>
                {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                style={{ paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', padding: 0 }} tabIndex={-1}>
                {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                style={{ paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', padding: 0 }} tabIndex={-1}>
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Password strength hint */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'var(--oncf-navy)', borderRadius: 'var(--radius)', fontSize: 12,
            color: 'rgba(255,255,255,0.65)',
          }}>
            <ShieldCheck size={14} color="var(--oncf-orange)" style={{ flexShrink: 0 }} />
            Choisissez un mot de passe fort d'au moins 8 caractères avec des lettres et des chiffres.
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn-login" type="submit" disabled={loading}>
            {loading
              ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : 'Mettre à jour le mot de passe'
            }
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          © {new Date().getFullYear()} ONCF — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
