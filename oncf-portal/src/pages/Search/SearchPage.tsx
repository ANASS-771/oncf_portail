import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchConteneurs, exportSearchConteneurs } from '../../api/client';
import type { Conteneur } from '../../types';
import { Download, Loader2, Search } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';

interface SearchFields {
  conteneur: string;
  bad: string;
  acquit: string;
  connaissement: string;
}

const empty: SearchFields = { conteneur: '', bad: '', acquit: '', connaissement: '' };

function hasEnoughInput(f: SearchFields) {
  return Object.values(f).some(v => v.trim().length >= 2);
}

export default function SearchPage() {
  const [fields, setFields] = useState<SearchFields>(empty);
  const [results, setResults] = useState<Conteneur[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const set = (key: keyof SearchFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }));

  const handleSearch = async () => {
    if (!hasEnoughInput(fields)) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        conteneur:     fields.conteneur.trim()     || undefined,
        bad:           fields.bad.trim()           || undefined,
        acquit:        fields.acquit.trim()        || undefined,
        connaissement: fields.connaissement.trim() || undefined,
      };
      const data = await searchConteneurs(params);
      setResults(data);
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFields(empty);
    setResults(null);
    setError(null);
  };

  const handleExport = async () => {
    if (!hasEnoughInput(fields)) return;
    setExporting(true);
    try {
      const params = {
        conteneur:     fields.conteneur.trim()     || undefined,
        bad:           fields.bad.trim()           || undefined,
        acquit:        fields.acquit.trim()        || undefined,
        connaissement: fields.connaissement.trim() || undefined,
      };
      const all = await exportSearchConteneurs(params);
      const headers = ['Conteneur','Client','Site','Statut','Entree','Sortie','Jours','BAD','Acquit'];
      const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
      const rows = all.map(c => [
        c.numeroConteneur, c.clientCode, c.siteLibelle ?? '', c.statutLogistique,
        fmt(c.dateEntree), fmt(c.dateSortie), c.nombreJoursStockage,
        c.numeroBAD ?? '', c.numeroAcquitement ?? '',
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recherche_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recherche</h1>
      </div>

      <div className="search-multi-form">
        <div className="search-multi-grid">
          <label className="search-field">
            <span>Conteneur</span>
            <input
              type="text"
              placeholder="Ex: MSCU123456"
              value={fields.conteneur}
              onChange={set('conteneur')}
              onKeyDown={onKeyDown}
              autoFocus
            />
          </label>

          <label className="search-field">
            <span>BAD</span>
            <input
              type="text"
              placeholder="Numero BAD"
              value={fields.bad}
              onChange={set('bad')}
              onKeyDown={onKeyDown}
            />
          </label>

          <label className="search-field">
            <span>Acquit / Acquittement</span>
            <input
              type="text"
              placeholder="Ex: AC-2024-..."
              value={fields.acquit}
              onChange={set('acquit')}
              onKeyDown={onKeyDown}
            />
          </label>

          <label className="search-field">
            <span>Connaissement (BLC)</span>
            <input
              type="text"
              placeholder="Numero connaissement"
              value={fields.connaissement}
              onChange={set('connaissement')}
              onKeyDown={onKeyDown}
            />
          </label>
        </div>

        <div className="search-multi-actions">
          <button
            onClick={handleSearch}
            disabled={!hasEnoughInput(fields) || loading}
            className="btn-primary"
          >
            <Search size={16} />
            Rechercher
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Effacer
          </button>
          {results !== null && results.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting || !hasEnoughInput(fields)}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-600)', fontSize:13, fontWeight:500, cursor:'pointer', opacity: exporting ? 0.5 : 1 }}
            >
              {exporting ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={14}/>}
              Exporter CSV
            </button>
          )}
        </div>

        {!hasEnoughInput(fields) && (
          <p className="search-hint">Remplissez au moins un champ (min. 2 caracteres).</p>
        )}
      </div>

      {loading && <PageSpinner message="Recherche en cours..." />}

      {error && <p className="error-message">{error}</p>}

      {results !== null && !loading && (
        <>
          <p className="result-count">
            {results.length} resultat(s)
            {results.length === 50 && <span style={{ marginLeft:8, fontSize:11, color:'var(--gray-400)' }}>(limite 50 — utilisez Export CSV pour tout récupérer)</span>}
          </p>
          {results.length === 0 ? (
            <p className="empty-state">Aucun conteneur trouve pour les criteres saisis.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Conteneur</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Statut</th>
                    <th>Entree</th>
                    <th>Sortie</th>
                    <th>BAD</th>
                    <th>Acquit</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(c => (
                    <tr
                      key={c.numeroConteneur}
                      className="clickable-row"
                      onClick={() => navigate(`/conteneurs/${c.numeroConteneur}`)}
                    >
                      <td className="font-mono">{c.numeroConteneur}</td>
                      <td>{c.clientCode}</td>
                      <td>{c.siteLibelle}</td>
                      <td>
                        <span className={`badge badge-${c.statutLogistique?.toLowerCase()}`}>
                          {c.statutLogistique}
                        </span>
                      </td>
                      <td>{fmt(c.dateEntree)}</td>
                      <td>{fmt(c.dateSortie)}</td>
                      <td>{c.numeroBAD || '—'}</td>
                      <td>{c.numeroAcquitement || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
