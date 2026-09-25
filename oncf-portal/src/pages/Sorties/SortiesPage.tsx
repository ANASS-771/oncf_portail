import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSorties, getSites, getActivitesSorties, exportSortiesAll, getDocumentPath, downloadPdf } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagedData } from '../../hooks/usePagedData';
import { PAGE_SIZE } from '../../constants';
import type { Sortie } from '../../types';
import { ChevronLeft, ChevronRight, Download, FileText, Loader2, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useAuth } from '../../contexts/AuthContext';

function DocButton({ label, loading, onClick }: Readonly<{ label: string; loading: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={loading}
      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', border:'1px solid var(--primary)', borderRadius:5, background:'var(--oncf-orange-bg)', color:'var(--primary)', fontSize:11, fontWeight:600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, whiteSpace:'nowrap' }}
    >
      {loading ? <Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/> : <FileText size={11}/>}
      {label}
    </button>
  );
}

export default function SortiesPage() {
  const [sites, setSites]         = useState<string[]>([]);
  const [activites, setActivites] = useState<string[]>([]);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const debouncedSearch           = useDebounce(search);
  const [site, setSite]           = useState('');
  const [activite, setActivite]   = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [acquit, setAcquit]       = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [csvLoading, setCsvLoading]     = useState(false);
  const location   = useLocation();
  const navigate   = useNavigate();
  const params     = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName } = useAuth();
  const clientCode = params.get('clientCode') || authClientCode || '';
  const clientName = params.get('clientName') || authClientName || '';
  const pageSize   = PAGE_SIZE;

  const { data, loading, error, load } = usePagedData<Sortie>(
    () => getSorties(page, pageSize, clientCode, debouncedSearch||undefined, site||undefined, dateFrom||undefined, dateTo||undefined, activite||undefined, acquit||undefined),
    [clientCode, page, debouncedSearch, site, activite, dateFrom, dateTo, acquit],
  );

  useEffect(() => {
    if (!clientCode) { navigate(isAdmin ? '/admin' : '/'); return; }
    load();
    getSites(clientCode).then(setSites).catch(console.error);
    getActivitesSorties(clientCode).then(setActivites).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientCode, load]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const hasFilters = !!(search || site || activite || dateFrom || dateTo || acquit);
  const clearFilters = () => { setSearch(''); setSite(''); setActivite(''); setDateFrom(''); setDateTo(''); setAcquit(''); setPage(1); };

  // Single-day helper: when dateFrom is set and dateTo is empty, auto-fill dateTo
  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    if (val && !dateTo) setDateTo(val);
    setPage(1);
  };

  const exportCSV = async () => {
    if (!clientCode) return;
    setCsvLoading(true);
    try {
      const all = await exportSortiesAll(clientCode, search||undefined, site||undefined, dateFrom||undefined, dateTo||undefined, activite||undefined, acquit||undefined);
      const headers = ['Conteneur','Date Sortie','N Acquit','Num BLC','Bon Sortie','Activite'];
      const rows = all.map(s => [s.numeroConteneur, s.dateSortie ? new Date(s.dateSortie).toLocaleDateString('fr-FR') : '', s.numeroAcquitement||'', s.numBLC||'', s.numBonSortie||'', s.activite||'']);
      const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(';')).join('\n');
      const url = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
      const a = document.createElement('a'); a.href=url; a.download=`sorties_${clientCode}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setCsvLoading(false); }
  };

  return (
    <div className="page" style={{ maxWidth:1200 }}>

      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-header-left">
          <div className="page-header-icon page-header-icon--success">
            <TrendingUp size={19} color="#16a34a" />
          </div>
          <div>
            <h1 className="page-title-sm">Sorties</h1>
            <span className="page-client-label">{clientName || clientCode}</span>
          </div>
        </div>
        <button onClick={exportCSV} disabled={!data || data.totalCount === 0 || csvLoading} className="btn-export">
          {csvLoading ? <Loader2 size={13} className="spin"/> : <Download size={13} />} Excel
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="stock-filters-panel">
        <div className="stock-filters-header">
          <SlidersHorizontal size={14} color="var(--gray-400)" style={{ flexShrink:0 }} />
          <span>Filtres</span>
        </div>

        <div className="stock-filters-grid">
          {/* Conteneur */}
          <label className="stock-filter-field stock-filter-search">
            <span className="stock-filter-label">Conteneur</span>
            <div className="stock-filter-search-input">
              <Search size={13} className="stock-filter-search-icon" />
              <input
                value={search}
                onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Numéro de conteneur…"
                className="stock-filter-control stock-filter-control-search"
              />
            </div>
          </label>

          {/* Site */}
          <label className="stock-filter-field">
            <span className="stock-filter-label">Site</span>
            <select value={site} onChange={e=>{setSite(e.target.value);setPage(1);}} className="stock-filter-control">
              <option value="">Tous les sites</option>
              {sites.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          {/* Activité */}
          <label className="stock-filter-field">
            <span className="stock-filter-label">Activité</span>
            <select value={activite} onChange={e=>{setActivite(e.target.value);setPage(1);}} className="stock-filter-control">
              <option value="">Toutes les activités</option>
              {activites.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          {/* N° Acquit */}
          <label className="stock-filter-field">
            <span className="stock-filter-label">N° Acquit</span>
            <input
              value={acquit}
              onChange={e=>{setAcquit(e.target.value);setPage(1);}}
              placeholder="N° acquit…"
              className="stock-filter-control"
            />
          </label>

          {/* Date de sortie */}
          <div className="stock-filter-field stock-date-range-field">
            <span className="stock-filter-label">Date de sortie (journée ou période)</span>
            <div className="stock-date-range-controls">
              <label className="stock-date-input-wrap">
                <span className="stock-date-label">Du</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e=>handleDateFromChange(e.target.value)}
                  className="stock-filter-control"
                />
              </label>
              <label className="stock-date-input-wrap">
                <span className="stock-date-label">Au</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e=>{setDateTo(e.target.value);setPage(1);}}
                  className="stock-filter-control"
                />
              </label>
            </div>
          </div>

          {hasFilters && (
            <div className="stock-filter-actions" style={{ gridColumn: 4 }}>
              <button onClick={clearFilters} className="stock-filter-clear-btn">
                <X size={12}/> Effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {error && <ErrorBanner onRetry={load} />}
      {loading ? (
        <PageSpinner />
      ) : !data || data.items.length === 0 ? (
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, padding:60, textAlign:'center' }}>
          <TrendingUp size={40} style={{ color:'var(--gray-300)', marginBottom:12 }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--gray-600)' }}>Aucune sortie trouvée</p>
          <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:4 }}>
            {hasFilters ? 'Essayez de modifier vos filtres.' : 'Aucune sortie enregistrée.'}
          </p>
        </div>
      ) : (
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)' }}>
              {data.totalCount.toLocaleString('fr-FR')} sortie{data.totalCount > 1 ? 's' : ''}
              {hasFilters && <span style={{ color:'var(--primary)' }}> · filtrées</span>}
            </span>
            <span style={{ fontSize:12, color:'var(--gray-400)' }}>Page {page}/{totalPages}</span>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--gray-50)', borderBottom:'1px solid var(--gray-200)' }}>
                  {['Conteneur','Date sortie','N° Acquit','Documents','Activité','État'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/conteneurs/${s.numeroConteneur}?tab=sorties&sortieId=${s.id}`)}
                    style={{ borderBottom: i < data.items.length-1 ? '1px solid var(--gray-100)' : 'none', cursor:'pointer', transition:'background 0.1s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--oncf-orange-bg)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='white')}
                  >
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:700, fontSize:12, color:'var(--gray-800)' }}>{s.numeroConteneur}</span>
                    </td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-600)', fontSize:12, whiteSpace:'nowrap' }}>{fmt(s.dateSortie)}</td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:11, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>{s.numeroAcquitement || '—'}</td>
                    <td style={{ padding:'11px 14px' }} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {s.numBLC && (
                          <DocButton
                            label={s.numBLC}
                            loading={pdfLoadingId === `blc-${s.id}`}
                            onClick={async () => { setPdfLoadingId(`blc-${s.id}`); try { await downloadPdf(getDocumentPath('blc', s.id), `BLC_${s.numBLC}.pdf`); } catch (e) { console.error('BLC download failed', e); } finally { setPdfLoadingId(null); } }}
                          />
                        )}
                        {s.numBonSortie && (
                          <DocButton
                            label={s.numBonSortie}
                            loading={pdfLoadingId === `bon-${s.id}`}
                            onClick={async () => { setPdfLoadingId(`bon-${s.id}`); try { await downloadPdf(getDocumentPath('bon-sortie', s.id), `BonSortie_${s.numBonSortie}.pdf`); } catch (e) { console.error('BonSortie download failed', e); } finally { setPdfLoadingId(null); } }}
                          />
                        )}
                        {!s.numBLC && !s.numBonSortie && <span style={{ color:'var(--gray-300)', fontSize:12 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:12 }}>{s.activite || '—'}</td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:12 }}>{s.etatConteneur || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
              <span style={{ fontSize:12, color:'var(--gray-500)' }}>Page {page} sur {totalPages}</span>
              <div style={{ display:'flex', gap:4 }}>
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, cursor:page<=1?'not-allowed':'pointer', opacity:page<=1?0.4:1 }}><ChevronLeft size={13}/> Précédent</button>
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, cursor:page>=totalPages?'not-allowed':'pointer', opacity:page>=totalPages?0.4:1 }}>Suivant <ChevronRight size={13}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
