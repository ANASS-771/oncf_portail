import { useEffect, useState } from 'react';
import { Check, Copy, HeadphonesIcon, Loader2, Mail, Search, UserPlus, X } from 'lucide-react';
import { createUser, getClients } from '../../api/client';
import type { ClientSummary } from '../../types';

// eslint-disable-next-line react-refresh/only-export-components
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

interface CreateModalProps {
  onClose: () => void;
  onCreated: (msg: string) => void;
}
interface CreatedInfo { login: string; password: string; role: 'CLIENT' | 'AGENT'; label: string }

export function CreateUserModal({ onClose, onCreated }: Readonly<CreateModalProps>) {
  const [roleTab, setRoleTab]               = useState<'CLIENT' | 'AGENT'>('CLIENT');
  const [clientSearch, setClientSearch]     = useState('');
  const [clients, setClients]               = useState<ClientSummary[]>([]);
  const [selectedCode, setSelectedCode]     = useState('');
  const [selectedName, setSelectedName]     = useState('');
  const [login, setLogin]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [searching, setSearching]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [created, setCreated]               = useState<CreatedInfo | null>(null);
  const [emailCopied, setEmailCopied]       = useState(false);

  useEffect(() => {
    if (roleTab !== 'CLIENT') return;
    setSearching(true);
    getClients(1, 20, clientSearch)
      .then(r => setClients(r.items))
      .finally(() => setSearching(false));
  }, [clientSearch, roleTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (roleTab === 'CLIENT' && !selectedCode) { setError('Sélectionnez un client.'); return; }
    if (!login.trim()) { setError('Le login est requis.'); return; }
    setLoading(true);
    try {
      const { temporaryPassword } = await createUser(login.trim(), roleTab, roleTab === 'CLIENT' ? selectedCode : undefined);
      const label = roleTab === 'AGENT' ? 'Agent ONCF' : selectedCode;
      onCreated(`Compte "${login.trim()}" créé (${label}).`);
      setCreated({ login: login.trim(), password: temporaryPassword, role: roleTab, label });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Création impossible.');
    } finally {
      setLoading(false);
    }
  };

  const emailBodyText = created
    ? `Bonjour,\n\nVotre compte d'accès au Portail Logistique ONCF a été créé.\n\nIdentifiant : ${created.login}\nMot de passe temporaire : ${created.password}\n\nConnectez-vous sur : ${window.location.origin}\n\nVous devrez changer votre mot de passe lors de votre première connexion.\n\nCordialement,\nAdministration ONCF`
    : '';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', borderRadius: 6,
    background: active ? (roleTab === 'AGENT' ? '#4338ca' : 'var(--primary)') : 'var(--gray-100)',
    color: active ? 'white' : 'var(--gray-500)',
    transition: 'all 0.15s',
  });

  // Success screen (post-creation)
  if (created) {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-panel" style={{ maxWidth: 480 }}>
          <div className="admin-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={18} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>Compte créé</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{created.login} — {created.label}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Identifiants créés</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>Login</span>
                <code style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, color: 'var(--gray-900)' }}>{created.login}</code>
                <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>Mot de passe</span>
                <code style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, color: 'var(--gray-900)' }}>{created.password}</code>
              </div>
            </div>

            <div style={{ border: '1px solid #c7d2fe', borderRadius: 8, padding: '14px', background: '#f5f3ff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} /> Message à envoyer au destinataire
                </span>
                <button
                  type="button"
                  onClick={async () => { await copyText(emailBodyText); setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #c7d2fe', borderRadius: 6, background: emailCopied ? '#4338ca' : 'white', color: emailCopied ? 'white' : '#4338ca', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                >
                  <Copy size={11} />
                  {emailCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <textarea
                readOnly
                value={emailBodyText}
                rows={7}
                style={{ width: '100%', padding: '8px 10px', fontSize: 11, fontFamily: 'ui-monospace,monospace', border: '1px solid #c7d2fe', borderRadius: 6, background: 'white', color: 'var(--gray-700)', resize: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.select()}
              />
            </div>

            <button onClick={onClose} style={{ width: '100%', padding: '9px 0', background: 'white', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-panel" style={{ maxWidth: 620 }}>
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--oncf-orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <UserPlus size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>Créer un compte</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Compte client ou agent ONCF</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <div className="admin-create-role-tabs">
              <button type="button" style={tabStyle(roleTab === 'CLIENT')} onClick={() => { setRoleTab('CLIENT'); setSelectedCode(''); setSelectedName(''); }}>
                Client
              </button>
              <button type="button" style={tabStyle(roleTab === 'AGENT')} onClick={() => setRoleTab('AGENT')}>
                <HeadphonesIcon size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Agent ONCF
              </button>
            </div>

            <div className={`admin-create-body-grid admin-create-body-grid--${roleTab === 'CLIENT' ? 'two' : 'one'}`}>

              {roleTab === 'CLIENT' && (
                <div className="admin-create-client-col">
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    1 — Sélectionner le client
                  </div>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                      placeholder="Rechercher…"
                      style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 7, outline: 'none', color: 'var(--gray-800)' }}
                    />
                  </div>
                  <div className="admin-create-client-list">
                    {searching && <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>Recherche…</div>}
                    {!searching && clients.map(c => {
                      const active = c.clientCode === selectedCode;
                      return (
                        <button key={c.clientCode} type="button"
                          onClick={() => { setSelectedCode(c.clientCode); setSelectedName(c.nomClient); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 7, border: '1px solid', borderColor: active ? 'var(--primary)' : 'transparent', background: active ? 'var(--oncf-orange-bg)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--gray-800)', fontFamily: 'monospace' }}>{c.clientCode}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 1 }}>{c.nomClient}</div>
                          </div>
                          {active && <Check size={13} color="var(--primary)" />}
                        </button>
                      );
                    })}
                    {!searching && clients.length === 0 && (
                      <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>Aucun client</div>
                    )}
                  </div>
                </div>
              )}

              <div className={roleTab === 'CLIENT' ? 'admin-create-form-col' : 'admin-create-form-col--full'}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  {roleTab === 'CLIENT' ? '2 — Définir les identifiants' : "Identifiants de l'agent"}
                </div>

                {roleTab === 'CLIENT' && (
                  <div style={{ padding: '8px 12px', borderRadius: 7, background: selectedCode ? 'var(--oncf-orange-bg)' : 'var(--gray-50)', border: '1px solid', borderColor: selectedCode ? 'var(--oncf-orange-border)' : 'var(--gray-200)', marginBottom: 14 }}>
                    {selectedCode
                      ? <><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{selectedCode}</span> <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>— {selectedName}</span></>
                      : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>← Sélectionnez un client</span>
                    }
                  </div>
                )}

                {roleTab === 'AGENT' && (
                  <div style={{ padding: '10px 12px', borderRadius: 7, background: '#eef2ff', border: '1px solid #c7d2fe', marginBottom: 14, fontSize: 12, color: '#4338ca' }}>
                    L&apos;agent aura accès uniquement aux réclamations — aucun accès aux données client.
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Login</label>
                  <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Login du compte"
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--gray-200)', borderRadius: 7, outline: 'none', color: 'var(--gray-800)' }} />
                </div>

                <div style={{ marginBottom: 16, padding: '9px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 7, fontSize: 12, color: '#166534' }}>
                  Un mot de passe temporaire sécurisé sera généré automatiquement par le serveur.
                </div>

                {error && (
                  <div style={{ padding: '8px 10px', background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 7, fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '9px 16px', background: roleTab === 'AGENT' ? '#4338ca' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                  {loading ? 'Création en cours…' : `Créer le compte ${roleTab === 'AGENT' ? 'agent' : 'client'}`}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
