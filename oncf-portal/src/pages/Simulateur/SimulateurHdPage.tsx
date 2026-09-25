import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getHdConteneurs, simulerHd, downloadFactureSimuleeHd } from '../../api/client';
import type { HdConteneurRow, HdConteneurResult, HdSimulateurResponse } from '../../types';
import { Calculator, ChevronRight, Loader2, ArrowLeft, AlertTriangle, Package, Download } from 'lucide-react';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PageSpinner from '../../components/ui/PageSpinner';
import { useAuth } from '../../contexts/AuthContext';

const fmt   = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtM  = (n: number) => fmt(n) + ' DH';
const fmtD  = (s: string) => new Date(s).toLocaleDateString('fr-FR');

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }: Readonly<{ step: 1 | 2 }>) {
  const steps = ['Sélection des conteneurs', 'Simulation'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((label, i) => {
        const n      = i + 1;
        const active = n === step;
        const done   = n < step;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 2 ? 1 : 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, fontWeight: 800,
                background: done ? '#16a34a' : active ? 'var(--primary)' : 'var(--gray-200)',
                color: done || active ? 'white' : 'var(--gray-500)',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? 'var(--gray-900)' : done ? '#16a34a' : 'var(--gray-400)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {n < 2 && (
              <div style={{ flex: 1, height: 2, margin: '0 12px', background: done ? '#16a34a' : 'var(--gray-200)', minWidth: 40 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Days counter badge ────────────────────────────────────────────────────────
function JoursBadge({ jours }: Readonly<{ jours: number }>) {
  const color = jours >= 30 ? '#dc2626' : jours >= 15 ? '#d97706' : 'var(--gray-600)';
  return (
    <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
      {jours}j
    </span>
  );
}

// ── Step 1: Container selection ───────────────────────────────────────────────
const PAGE_SIZE = 25;

function Step1({
  clientCode,
  onSimulate,
}: Readonly<{
  clientCode: string;
  onSimulate: (rows: HdConteneurRow[], date: string) => void;
}>) {
  const [rows, setRows]         = useState<HdConteneurRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [running, setRunning]   = useState(false);
  const [query, setQuery]       = useState('');
  const [page, setPage]         = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const [exitDate, setExitDate] = useState(today);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getHdConteneurs(clientCode)
      .then(data => {
        setRows(data);
        setSelected(new Set(data.map(r => r.numeroConteneur)));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [clientCode]);

  useEffect(() => { setPage(1); }, [query]); // eslint-disable-line react-hooks/set-state-in-effect

  const filtered = query.trim()
    ? rows.filter(r => r.numeroConteneur.toUpperCase().includes(query.trim().toUpperCase()))
    : rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.numeroConteneur));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) filtered.forEach(r => next.delete(r.numeroConteneur));
    else                     filtered.forEach(r => next.add(r.numeroConteneur));
    setSelected(next);
  };

  const toggle = (num: string) => {
    const next = new Set(selected);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setSelected(next);
  };

  const handleSimulate = () => {
    if (selected.size === 0 || !exitDate) return;
    setRunning(true);
    onSimulate(rows.filter(r => selected.has(r.numeroConteneur)), exitDate);
  };

  const daysSince = (d: string) =>
    Math.max(1, Math.round((new Date(exitDate || today).getTime() - new Date(d).getTime()) / 86400000) + 1);

  if (loading) return <PageSpinner />;
  if (error)   return <ErrorBanner onRetry={() => { setError(false); setLoading(true); getHdConteneurs(clientCode).then(d => { setRows(d); setSelected(new Set(d.map(r => r.numeroConteneur))); }).catch(() => setError(true)).finally(() => setLoading(false)); }} />;

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
        <Package size={40} style={{ marginBottom: 12, opacity: 0.2 }} />
        <p style={{ fontSize: 15, fontWeight: 600 }}>Aucun conteneur Hors Douane en stock</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Ce client n'a pas de conteneurs HD actifs actuellement</p>
      </div>
    );
  }

  return (
    <>
      {/* Date + filter + action bar */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Date de sortie estimée
          </label>
          <input
            type="date"
            value={exitDate}
            min={today}
            onChange={e => setExitDate(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, background: 'white' }}
          />
        </div>

        {/* Filter by container number */}
        <input
          type="text"
          placeholder="Filtrer par N° conteneur…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, background: 'white' }}
        />

        {/* Selection counter */}
        <div style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
          <strong>{selected.size}</strong> / {rows.length} sélectionné(s)
        </div>

        <button
          onClick={handleSimulate}
          disabled={selected.size === 0 || !exitDate || running}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: selected.size === 0 ? 'var(--gray-200)' : 'var(--primary)',
            color: selected.size === 0 ? 'var(--gray-400)' : 'white',
            cursor: selected.size === 0 || running ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 13,
          }}
        >
          {running ? <Loader2 size={14} className="spin" /> : <ChevronRight size={14} />}
          Simuler
        </button>
      </div>

      {/* Container table */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              <th style={{ padding: '10px 14px', width: 40 }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>Conteneur</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>Taille</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>Site</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>Entrée</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>Jours estimés</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                  Aucun conteneur trouvé pour « {query} »
                </td>
              </tr>
            ) : pageRows.map((r, i) => {
              const sel = selected.has(r.numeroConteneur);
              return (
                <tr
                  key={r.numeroConteneur}
                  onClick={() => toggle(r.numeroConteneur)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: i < pageRows.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    background: sel ? 'var(--primary-bg)' : 'white',
                    transition: 'background 0.1s',
                    opacity: sel ? 1 : 0.5,
                  }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <input type="checkbox" checked={sel} onChange={() => toggle(r.numeroConteneur)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace,monospace', fontWeight: 600, color: 'var(--gray-800)' }}>{r.numeroConteneur}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-600)' }}>{r.tailleConteneur || r.typeConteneur || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{r.siteLibelle || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{fmtD(r.dateEntree)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <JoursBadge jours={daysSince(r.dateEntree)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {filtered.length} conteneur(s) · page {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid var(--gray-200)', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: page === 1 ? 'var(--gray-300)' : 'var(--gray-700)' }}
              >‹ Préc</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid var(--gray-200)', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, color: page === totalPages ? 'var(--gray-300)' : 'var(--gray-700)' }}
              >Suiv ›</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent }: Readonly<{ label: string; value: string; accent: string }>) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '14px 18px', borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ── Container result row (collapsible tranches) ───────────────────────────────
function ResultRow({ c, isCas1 }: Readonly<{ c: HdConteneurResult; isCas1: boolean }>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', borderBottom: '1px solid var(--gray-100)', transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? 'var(--primary-bg)' : 'white')}
      >
        <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace,monospace', fontWeight: 600, color: 'var(--gray-800)' }}>{c.numeroConteneur}</td>
        <td style={{ padding: '10px 14px', color: 'var(--gray-600)' }}>{c.typeTC}'</td>
        <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{c.siteLibelle || '—'}</td>
        <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{fmtD(c.dateEntree)}</td>
        <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gray-700)' }}>{c.nombreJours}</td>
        <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gray-700)' }}>{c.joursFacturables}</td>
        <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtM(c.magasinageHT)}</td>
        {!isCas1 && <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gray-500)' }}>{fmtM(c.manutentionHT)}</td>}
        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtM(c.totalHT)}</td>
        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtM(c.totalTTC)}</td>
        <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, color: 'var(--gray-400)' }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && c.tranches.map((t, ti) => (
        <tr key={ti} style={{ background: '#f9fafb', borderBottom: '1px solid var(--gray-100)' }}>
          <td colSpan={2} style={{ padding: '7px 14px 7px 28px', color: 'var(--gray-500)', fontSize: 12, fontStyle: 'italic' }}>{t.designation}</td>
          <td colSpan={2} />
          <td style={{ padding: '7px 14px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)' }}>{t.nombreJours}j</td>
          <td />
          <td style={{ padding: '7px 14px', textAlign: 'right', fontSize: 12, color: 'var(--gray-600)' }}>
            {t.prixUnitaire > 0 ? `${fmt(t.prixUnitaire)} × ${t.nombreJours}j` : 'Franchise'}
          </td>
          {!isCas1 && <td />}
          <td style={{ padding: '7px 14px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{fmtM(t.montantHT)}</td>
          <td colSpan={2} />
        </tr>
      ))}
    </>
  );
}

// ── Step 2: Simulation result ─────────────────────────────────────────────────
function Step2({ result, onBack }: Readonly<{ result: HdSimulateurResponse; onBack: () => void }>) {
  const { totaux, conteneurs, billingCas } = result;
  const isCas1 = billingCas === 1;
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadFactureSimuleeHd(
        result.clientCode,
        result.dateSortieEstimee,
        result.conteneurs.map(c => c.numeroConteneur),
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, color: 'var(--gray-600)' }}
        >
          <ArrowLeft size={13} /> Modifier la sélection
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--primary)', borderRadius: 7, background: 'var(--primary)', fontSize: 12, cursor: pdfLoading ? 'wait' : 'pointer', color: 'white', fontWeight: 600, opacity: pdfLoading ? 0.7 : 1 }}
        >
          {pdfLoading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
          {pdfLoading ? 'Génération...' : 'Télécharger facture simulée'}
        </button>
      </div>

      {/* Cas 1 banner */}
      {isCas1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 8, marginBottom: 16 }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <strong style={{ color: '#92400e' }}>Deux factures distinctes (Cas 1)</strong>
            <span style={{ color: '#78350f', marginLeft: 8 }}>La manutention est facturée séparément à Maersk ({result.nbConteneursMaersk} conteneur(s) × 200 DH = {fmtM(result.maerskManutention_HT ?? 0)} HT / {fmtM(result.maerskManutention_TTC ?? 0)} TTC)</span>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total HT (client)" value={fmtM(totaux.totalGeneral_HT)} accent="var(--primary)" />
        <KpiCard label="TVA 20%" value={fmtM(totaux.totalGeneral_TTC - totaux.totalGeneral_HT)} accent="#f59e0b" />
        <KpiCard label="Total TTC (client)" value={fmtM(totaux.totalGeneral_TTC)} accent="#16a34a" />
      </div>

      {/* Secondary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conteneurs</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)' }}>{totaux.nombreConteneurs} <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>({totaux.nombreConteneurs20}×20' + {totaux.nombreConteneurs40}×40')</span></div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Magasinage HT</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)' }}>{fmtM(totaux.totalMagasinage_HT)}</div>
        </div>
        {!isCas1 && (
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manutention HT</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)' }}>{fmtM(totaux.totalManutention_HT)}</div>
          </div>
        )}
        {isCas1 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manutention → Maersk HT</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e' }}>{fmtM(result.maerskManutention_HT ?? 0)}</div>
          </div>
        )}
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date sortie estimée</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)' }}>{fmtD(result.dateSortieEstimee)}</div>
        </div>
      </div>

      {/* Tariff info */}
      {!result.hasConfig && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8, fontStyle: 'italic' }}>
          Tarifs fixes appliqués : TC 20' = 50 DH/j · TC 40'/45' = 100 DH/j · Manutention = 200 DH/conteneur
          {result.franchiseJours > 0 && ` · Franchise : ${result.franchiseJours} j`}
        </div>
      )}

      {/* Container detail table */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              {(['Conteneur', 'TC', 'Site', 'Entrée', 'Jours', 'J. Fact.', 'Magasinage HT', ...(!isCas1 ? ['Manutention HT'] : []), 'Total HT', 'Total TTC', '']).map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Conteneur' || h === 'TC' || h === 'Site' || h === 'Entrée' ? 'left' : 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)', whiteSpace: 'nowrap', width: h === '' ? 30 : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conteneurs.map((c) => (
              <ResultRow key={c.numeroConteneur} c={c} isCas1={isCas1} />
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
              <td colSpan={6} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: 'var(--gray-700)' }}>TOTAL</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtM(totaux.totalMagasinage_HT)}</td>
              {!isCas1 && <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--gray-500)' }}>{fmtM(totaux.totalManutention_HT)}</td>}
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtM(totaux.totalGeneral_HT)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtM(totaux.totalGeneral_TTC)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SimulateurHdPage() {
  const [step, setStep]       = useState<1 | 2>(1);
  const [result, setResult]   = useState<HdSimulateurResponse | null>(null);
  const [simError, setSimError] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const params    = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName } = useAuth();
  const clientCode = params.get('clientCode') || authClientCode || '';
  const clientName = params.get('clientName') || authClientName || '';

  useEffect(() => {
    if (!clientCode) navigate(isAdmin ? '/admin' : '/');
  }, [clientCode, isAdmin, navigate]);

  const handleSimulate = async (rows: HdConteneurRow[], date: string) => {
    setSimError(false);
    try {
      const res = await simulerHd(clientCode, date, rows.map(r => r.numeroConteneur));
      setResult(res);
      setStep(2);
    } catch {
      setSimError(true);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-left">
          <div className="page-header-icon">
            <Calculator size={18} color="var(--primary)" />
          </div>
          <div>
            <h1 className="page-title-sm">Simulateur HD</h1>
            <span className="page-client-label">{clientName || clientCode}</span>
          </div>
        </div>
      </div>

      <StepBar step={step} />

      {simError && (
        <div style={{ marginBottom: 12 }}>
          <ErrorBanner onRetry={() => setSimError(false)} />
        </div>
      )}

      {step === 1 ? (
        <Step1 clientCode={clientCode} onSimulate={handleSimulate} />
      ) : result ? (
        <Step2 result={result} onBack={() => setStep(1)} />
      ) : null}
    </div>
  );
}
