import { useEffect, useState } from 'react';
import { getAllReclamations, getReclamationAudit, updateReclamation } from '../../api/client';
import type { PagedResult, Reclamation, ReclamationAuditEntry, UpdateReclamationPayload } from '../../types';
import {
  ChevronLeft, ChevronRight, Clock, MessageSquare, Search, User, X,
} from 'lucide-react';
import { useAppFeedback } from '../../components/ui/AppFeedback';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { PAGE_SIZE } from '../../constants';
import AdminSubNav from '../../components/layout/AdminSubNav';
import { StatutBadge, STATUT_LABEL } from '../../components/ui/StatutBadge';

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

const utcDate = (d: string) => new Date(d.endsWith('Z') ? d : d + 'Z');

const fmt = (d: string) =>
  utcDate(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtFull = (d: string) =>
  utcDate(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Treat modal ───────────────────────────────────────────────────────────────
interface TreatModalProps {
  rec: Reclamation;
  onClose: () => void;
  onSaved: () => void;
}

function TreatModal({ rec, onClose, onSaved }: Readonly<TreatModalProps>) {
  const { notify } = useAppFeedback();
  const [form, setForm] = useState<UpdateReclamationPayload>({
    statut:       rec.statut,
    reponseAdmin: rec.reponseAdmin ?? '',
  });
  const [audit, setAudit] = useState<ReclamationAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getReclamationAudit(rec.id).then(setAudit).catch(console.error);
  }, [rec.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.statut) return;
    setLoading(true);
    try {
      await updateReclamation(rec.id, form);
      notify({ type: 'success', title: 'Réclamation mise à jour', message: `Statut : ${STATUT_LABEL[form.statut] ?? form.statut}` });
      onSaved();
    } catch {
      notify({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour la réclamation.' });
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
        background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
              {rec.numeroReference} — {rec.clientCode}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>{rec.objet}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--gray-400)" />
          </button>
        </div>

        {/* Read-only info */}
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Description du client
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {rec.description}
          </p>
        </div>

        {(rec.numeroConteneur || rec.numeroFacture || rec.telephoneContact) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {rec.numeroConteneur && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '3px 10px', borderRadius: 6 }}>
                Conteneur : <b>{rec.numeroConteneur}</b>
              </span>
            )}
            {rec.numeroFacture && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '3px 10px', borderRadius: 6 }}>
                Facture : <b>{rec.numeroFacture}</b>
              </span>
            )}
            {rec.telephoneContact && (
              <span style={{ fontSize: 12, color: 'var(--gray-600)', background: '#f3f4f6', padding: '3px 10px', borderRadius: 6 }}>
                Tél : <b>{rec.telephoneContact}</b>
              </span>
            )}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--gray-200)', margin: '16px 0' }} />

        {/* Admin form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Statut *
            <select required value={form.statut}
              onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
              style={{ ...inputStyle, marginTop: 4 }}>
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_COURS">En cours</option>
              <option value="RESOLUE">Résolue</option>
              <option value="FERMEE">Fermée</option>
            </select>
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
            Réponse au client <span style={{ fontWeight: 400 }}>(optionnel)</span>
            <textarea value={form.reponseAdmin ?? ''} rows={4} maxLength={2000}
              onChange={e => setForm(f => ({ ...f, reponseAdmin: e.target.value }))}
              placeholder="Votre réponse sera visible par le client..."
              style={{ ...inputStyle, marginTop: 4, resize: 'vertical', fontFamily: 'inherit' }} />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '9px 0', borderRadius: 7, border: '1px solid var(--gray-200)',
              background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)',
            }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '9px 0', borderRadius: 7, border: 'none',
              background: 'var(--primary)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, color: 'white', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>

        {audit.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--gray-200)', margin: '20px 0 14px' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Historique
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audit.map(e => (
                <div key={e.auditId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--oncf-orange-bg)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={12} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--gray-700)' }}>
                      <b>{e.changedByLogin}</b>
                      {' → '}
                      <StatutBadge statut={e.newStatut} />
                      {e.oldStatut && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 4 }}>(était: {STATUT_LABEL[e.oldStatut] ?? e.oldStatut})</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{fmtFull(e.changedAt)}</div>
                    {e.note && <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, fontStyle: 'italic' }}>{e.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminReclamationsPage() {
  const [result, setResult]     = useState<PagedResult<Reclamation> | null>(null);
  const [page, setPage]         = useState(1);
  const [statut, setStatut]       = useState('');
  const [categorie, setCategorie] = useState('');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [treating, setTreating] = useState<Reclamation | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    getAllReclamations(page, PAGE_SIZE, statut || undefined, categorie || undefined, search || undefined)
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statut, categorie, search]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil((result?.totalCount ?? 0) / PAGE_SIZE);
  const items = result?.items ?? [];

  return (
    <div className="page admin-page">
      <AdminSubNav />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--oncf-orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={17} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>Réclamations clients</h1>
          {result && (
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{result.totalCount} réclamation{result.totalCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Client, objet, conteneur, facture..."
              style={{ padding: '7px 10px 7px 28px', borderRadius: 7, border: '1px solid var(--gray-200)', fontSize: 13, width: 260 }} />
          </div>
          <button type="submit" style={{
            padding: '7px 14px', borderRadius: 7, border: 'none', background: 'var(--primary)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Chercher
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} style={{
              padding: '7px 10px', borderRadius: 7, border: '1px solid var(--gray-200)',
              background: 'white', cursor: 'pointer',
            }}>
              <X size={13} color="var(--gray-400)" />
            </button>
          )}
        </form>

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

        <select value={categorie} onChange={e => { setCategorie(e.target.value); setPage(1); }} style={{
          padding: '7px 10px', borderRadius: 7, border: '1px solid var(--gray-200)', fontSize: 13,
          background: 'white', cursor: 'pointer',
        }}>
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORIE_LABEL).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {error && <ErrorBanner onRetry={load} />}
      {loading ? <PageSpinner /> : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
          <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Aucune réclamation{statut || categorie || search ? ' pour ces filtres' : ''}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                {['Référence', 'Client', 'Catégorie', 'Objet', 'Statut', 'Assigné à', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--gray-500)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(rec => (
                <tr key={rec.id}
                  style={{ borderBottom: '1px solid var(--gray-100)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gray-500)', fontSize: 11 }}>
                    {rec.numeroReference}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{rec.clientCode}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-600)' }}>
                    {CATEGORIE_LABEL[rec.categorie] ?? rec.categorie}
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 240 }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.objet}
                    </div>
                    {(rec.numeroConteneur || rec.numeroFacture) && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        {rec.numeroConteneur && `Cont: ${rec.numeroConteneur}`}
                        {rec.numeroConteneur && rec.numeroFacture && ' · '}
                        {rec.numeroFacture && `Fact: ${rec.numeroFacture}`}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}><StatutBadge statut={rec.statut} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    {rec.assignedToLogin ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#f3f4f6', color: 'var(--gray-600)' }}>
                        <User size={10} />{rec.assignedToLogin}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--gray-300)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                    {fmt(rec.dateCreation)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => setTreating(rec)} style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid var(--primary)',
                      background: 'var(--oncf-orange-bg)', color: 'var(--primary)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Traiter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {treating && (
        <TreatModal
          rec={treating}
          onClose={() => setTreating(null)}
          onSaved={() => { setTreating(null); load(); }}
        />
      )}
    </div>
  );
}
