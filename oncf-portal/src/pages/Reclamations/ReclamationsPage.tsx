import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReclamation, getReclamations, getReclamationDetail } from '../../api/client';
import type { CreateReclamationPayload, Reclamation } from '../../types';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Plus, X } from 'lucide-react';
import { PAGE_SIZE_SM as PAGE_SIZE } from '../../constants';
import PageSpinner from '../../components/ui/PageSpinner';
import { useAppFeedback } from '../../components/ui/AppFeedback';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { StatutBadge } from '../../components/ui/StatutBadge';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIE_LABEL: Record<string, string> = {
  RETARD_CHARGEMENT_TC:   'Retard de chargement de conteneur',
  RETARD_ACHEMINEMENT:    "Retard d'acheminement du train",
  RETARD_ENVOI_BAD:       "Retard d'envoi du BAD",
  TC_ENDOMMAGE:           'TC endommagé',
  CONTESTATION_FACTURE:   'Contestation du montant facturé',
  INDISPO_ENGIN:          "Indisponibilité d'engin",
  ERREUR_MONTANT_FACTURE: 'Erreur sur le montant de facture communiqué',
  COMPORTEMENT_PERSONNEL: 'Mauvais comportement du personnel',
  RETARD_OPERATIONS:      'Retard des opérations de pesage, de visite, etc.',
  AUTRE:                  'Autre',
};

// ── Create modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  clientCode: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateModal({ clientCode, onClose, onCreated }: Readonly<CreateModalProps>) {
  const { notify } = useAppFeedback();
  const [form, setForm] = useState<CreateReclamationPayload>({
    clientCode,
    categorie:        '',
    objet:            '',
    description:      '',
    numeroConteneur:  '',
    numeroFacture:    '',
    telephoneContact: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof CreateReclamationPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categorie || !form.objet || !form.description) return;
    setLoading(true);
    try {
      await createReclamation(form);
      notify({ type: 'success', title: 'Réclamation envoyée', message: 'Votre réclamation a été enregistrée.' });
      onCreated();
    } catch {
      notify({ type: 'error', title: 'Erreur', message: 'Impossible d\'envoyer la réclamation.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--gray-200)',
    fontSize: 13, boxSizing: 'border-box', background: 'white',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)' }}>
            Nouvelle réclamation
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--gray-400)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Catégorie *
            <select required value={form.categorie} onChange={set('categorie')} style={{ ...inputStyle, marginTop: 4 }}>
              <option value="">Sélectionner...</option>
              <option value="RETARD_CHARGEMENT_TC">Retard de chargement de conteneur</option>
              <option value="RETARD_ACHEMINEMENT">Retard d'acheminement du train</option>
              <option value="RETARD_ENVOI_BAD">Retard d'envoi du BAD</option>
              <option value="TC_ENDOMMAGE">TC endommagé</option>
              <option value="CONTESTATION_FACTURE">Contestation du montant facturé</option>
              <option value="INDISPO_ENGIN">Indisponibilité d'engin</option>
              <option value="ERREUR_MONTANT_FACTURE">Erreur sur le montant de facture communiqué</option>
              <option value="COMPORTEMENT_PERSONNEL">Mauvais comportement du personnel</option>
              <option value="RETARD_OPERATIONS">Retard des opérations de pesage, de visite, etc.</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Objet *
            <input required maxLength={200} value={form.objet} onChange={set('objet')}
              placeholder="Titre court de la réclamation" style={{ ...inputStyle, marginTop: 4 }} />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Description *
            <textarea required maxLength={2000} value={form.description} onChange={set('description')}
              placeholder="Décrivez votre réclamation en détail..." rows={4}
              style={{ ...inputStyle, marginTop: 4, resize: 'vertical', fontFamily: 'inherit' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
              N° Conteneur <span style={{ fontWeight: 400 }}>(optionnel)</span>
              <input value={form.numeroConteneur ?? ''} onChange={set('numeroConteneur')}
                placeholder="ex: MRSU5786666" style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
              N° Facture <span style={{ fontWeight: 400 }}>(optionnel)</span>
              <input value={form.numeroFacture ?? ''} onChange={set('numeroFacture')}
                placeholder="ex: FAC-2026-0001" style={{ ...inputStyle, marginTop: 4 }} />
            </label>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Téléphone de contact <span style={{ fontWeight: 400 }}>(optionnel)</span>
            <input value={form.telephoneContact ?? ''} onChange={set('telephoneContact')}
              placeholder="ex: 0600000000" style={{ ...inputStyle, marginTop: 4 }} />
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '9px 0', borderRadius: 7, border: '1px solid var(--gray-200)',
              background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: 'var(--gray-600)',
            }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '9px 0', borderRadius: 7, border: 'none',
              background: 'var(--primary)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, color: 'white', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Envoi...' : 'Envoyer la réclamation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ rec: initial, onClose }: Readonly<{ rec: Reclamation; onClose: () => void }>) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const [rec, setRec] = useState(initial);
  const [loading, setLoading] = useState(true);

  // Fetch fresh data so reponseAdmin / statut are up-to-date
  useEffect(() => {
    getReclamationDetail(initial.id)
      .then(setRec)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initial.id]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
              {rec.numeroReference}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>{rec.objet}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={18} color="var(--gray-400)" />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatutBadge statut={rec.statut} />
          <span style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 10px', borderRadius: 20, color: '#374151', fontWeight: 600 }}>
            {CATEGORIE_LABEL[rec.categorie] ?? rec.categorie}
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fmt(rec.dateCreation)}</span>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {rec.description}
          </p>
        </div>

        {(rec.numeroConteneur || rec.numeroFacture || rec.telephoneContact) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {rec.numeroConteneur && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                Conteneur : <b>{rec.numeroConteneur}</b>
              </span>
            )}
            {rec.numeroFacture && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                Facture : <b>{rec.numeroFacture}</b>
              </span>
            )}
            {rec.telephoneContact && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                Tél : <b>{rec.telephoneContact}</b>
              </span>
            )}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--gray-300)' }} />
          </div>
        )}

        {!loading && rec.reponseAdmin && (
          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 12, marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Réponse ONCF {rec.dateReponse ? `— ${fmt(rec.dateReponse)}` : ''}
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {rec.reponseAdmin}
            </p>
          </div>
        )}

        {!loading && !rec.reponseAdmin && (
          <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--gray-400)' }}>
            En attente de réponse de l'équipe ONCF.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [statut, setStatut]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [selected, setSelected]         = useState<Reclamation | null>(null);
  const navigate                        = useNavigate();
  const { isAdmin, clientCode, clientName } = useAuth();

  const load = () => {
    if (!clientCode) return;
    setLoading(true);
    setError(false);
    getReclamations(clientCode, page, PAGE_SIZE, statut || undefined)
      .then(r => { setReclamations(r.items); setTotal(r.totalCount); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!clientCode) { navigate(isAdmin ? '/admin' : '/'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [clientCode, page, statut]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const enAttente = reclamations.filter(r => r.statut === 'EN_ATTENTE').length;
  const enCours   = reclamations.filter(r => r.statut === 'EN_COURS').length;

  return (
    <div className="page" style={{ maxWidth: 960 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--oncf-orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={19} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>Réclamations</h1>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{clientName || clientCode}</span>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, fontWeight: 700,
        }}>
          <Plus size={15} /> Nouvelle réclamation
        </button>
      </div>

      {/* ── Summary badges ── */}
      {(enAttente > 0 || enCours > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {enAttente > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: 20 }}>
              {enAttente} en attente
            </span>
          )}
          {enCours > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 20 }}>
              {enCours} en cours
            </span>
          )}
        </div>
      )}

      {/* ── Filter ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={{
          padding: '7px 10px', borderRadius: 7, border: '1px solid var(--gray-200)', fontSize: 13,
          background: 'white', cursor: 'pointer',
        }}>
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLUE">Résolue</option>
          <option value="FERMEE">Fermée</option>
        </select>
        {total > 0 && (
          <span style={{ fontSize: 12, color: 'var(--gray-400)', alignSelf: 'center' }}>
            {total} réclamation{total > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {error && <ErrorBanner onRetry={load} />}
      {loading ? <PageSpinner /> : reclamations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
          <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Aucune réclamation{statut ? ' pour ce statut' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reclamations.map(rec => (
            <div key={rec.id} onClick={() => setSelected(rec)} style={{
              background: 'white', borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
              border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 14,
              transition: 'box-shadow 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.4px' }}>
                    {rec.numeroReference}
                  </span>
                  <span style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                    {CATEGORIE_LABEL[rec.categorie]}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>
                  {rec.objet}
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--gray-400)', flexWrap: 'wrap' }}>
                  {rec.numeroConteneur && <span>Conteneur : {rec.numeroConteneur}</span>}
                  {rec.numeroFacture   && <span>Facture : {rec.numeroFacture}</span>}
                  <span>{fmt(rec.dateCreation)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <StatutBadge statut={rec.statut} />
                {rec.reponseAdmin && (
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Réponse disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '6px 10px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '6px 10px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {showCreate && (
        <CreateModal clientCode={clientCode} onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); setPage(1); load(); }} />
      )}

      {selected && <DetailPanel rec={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
