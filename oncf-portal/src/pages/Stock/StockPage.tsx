import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStock, getSites, getActivitesStock, getEntreesJour, exportStockAll, downloadPdf } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagedData } from '../../hooks/usePagedData';
import { PAGE_SIZE, VISITE_CODES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import type { Conteneur } from '../../types';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, FileText, Loader2, Package, Search, SlidersHorizontal, X } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';

function DaysBadge({ days }: Readonly<{ days: number }>) {
  const [bg, color] =
    days >= 30 ? ['#fef2f2','#dc2626'] :
    days >= 15 ? ['#fffbeb','#d97706'] :
    days >= 7  ? ['#eff6ff','#2563eb'] :
                 ['#f0fdf4','#16a34a'];
  return <span style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:bg, color, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{days}j</span>;
}


export default function StockPage() {
  const [sites, setSites]         = useState<string[]>([]);
  const [activites, setActivites] = useState<string[]>([]);
  const [page, setPage]           = useState(1);
  const [site, setSite]           = useState('');
  const [activite, setActivite]   = useState('');
  const [search, setSearch]       = useState('');
  const debouncedSearch           = useDebounce(search);
  const [bad, setBad]             = useState('');
  const [port, setPort]           = useState('');
  const [acquit, setAcquit]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [pesage, setPesage]           = useState<boolean | undefined>(undefined);
  const [visiteCode, setVisiteCode]   = useState<number | undefined>(undefined);
  const [sortBy, setSortBy]       = useState('entree');
  const [sortDir, setSortDir]     = useState<'ASC' | 'DESC'>('DESC');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [csvLoading, setCsvLoading]     = useState(false);
  const [entreesJour, setEntreesJour]   = useState<{ aujourdhui: number; cetteSemaine: number } | null>(null);
  const location   = useLocation();
  const navigate   = useNavigate();
  const params     = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName } = useAuth();
  const clientCode = params.get('clientCode') || authClientCode || '';
  const clientName = params.get('clientName') || authClientName || '';
  const pageSize   = PAGE_SIZE;

  const { data, loading, error, load } = usePagedData<Conteneur>(
    () => getStock(clientCode, page, pageSize, site, undefined, debouncedSearch, dateFrom, dateTo, bad || undefined, port || undefined, activite || undefined, acquit || undefined, pesage, visiteCode, sortBy, sortDir),
    [clientCode, page, site, activite, debouncedSearch, dateFrom, dateTo, bad, port, acquit, pesage, visiteCode, sortBy, sortDir],
  );

  useEffect(() => {
    if (!clientCode) { navigate(isAdmin ? '/admin' : '/'); return; }
    load();
    getSites(clientCode).then(setSites).catch(console.error);
    getActivitesStock(clientCode).then(setActivites).catch(console.error);
    getEntreesJour(clientCode).then(setEntreesJour).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientCode, load]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const hasFilters = !!(search || bad || port || acquit || site || activite || dateFrom || dateTo || pesage !== undefined || visiteCode !== undefined);
  const clearFilters = () => { setSearch(''); setBad(''); setPort(''); setAcquit(''); setSite(''); setActivite(''); setDateFrom(''); setDateTo(''); setPesage(undefined); setVisiteCode(undefined); setPage(1); };

  // Single-day helper: when dateFrom changes and dateTo is empty, auto-fill dateTo
  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    if (val && !dateTo) setDateTo(val);
    setPage(1);
  };

  const exportCSV = async () => {
    if (!clientCode) return;
    setCsvLoading(true);
    try {
      const all = await exportStockAll(clientCode, site||undefined, search||undefined, dateFrom||undefined, dateTo||undefined, bad||undefined, port||undefined, activite||undefined, acquit||undefined);
      const headers = ['Conteneur','N Acquit','Site','Ville','Type','Taille','Activite','Statut','Date Entree','Jours Stockage'];
      const rows = all.map(c => [c.numeroConteneur, c.numeroAcquitement||'', c.siteLibelle, c.ville, c.typeConteneur, c.tailleConteneur, c.typeActivite||'', c.statutLogistique, c.dateEntree ? new Date(c.dateEntree).toLocaleDateString('fr-FR') : '', c.nombreJoursStockage]);
      const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(';')).join('\n');
      const url = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
      const a = document.createElement('a'); a.href=url; a.download=`stock_${clientCode}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setCsvLoading(false); }
  };

  return (
    <div className="page" style={{ maxWidth:1200 }}>

      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-header-left">
          <div className="page-header-icon">
            <Package size={19} color="var(--primary)" />
          </div>
          <div>
            <h1 className="page-title-sm">Stock en cours</h1>
            <span className="page-client-label">{clientName || clientCode}</span>
          </div>
        </div>
        <div className="page-actions">
          <button onClick={exportCSV} disabled={!data || data.totalCount === 0 || csvLoading} className="btn-export">
            {csvLoading ? <Loader2 size={13} className="spin"/> : <Download size={13} />} Excel
          </button>
          <button
            onClick={async () => {
              setPdfLoading(true);
              try {
                const qs = new URLSearchParams();
                if (site)     qs.set('site', site);
                if (search)   qs.set('q', search);
                if (bad)      qs.set('bad', bad);
                if (port)     qs.set('port', port);
                if (activite) qs.set('activite', activite);
                if (dateFrom) qs.set('dateFrom', dateFrom);
                if (dateTo)   qs.set('dateTo', dateTo);
                if (acquit)   qs.set('acquit', acquit);
                const path = `/documents/etat-stock/${clientCode}${qs.toString() ? '?' + qs.toString() : ''}`;
                await downloadPdf(path, `EtatStock_${clientCode}_${new Date().toISOString().slice(0,10)}.pdf`);
              } catch (e) { console.error('PDF download failed', e); } finally { setPdfLoading(false); }
            }}
            disabled={!data || data.totalCount === 0 || pdfLoading}
            className="btn-export-primary"
          >
            {pdfLoading ? <Loader2 size={13} className="spin"/> : <FileText size={13} />} PDF
          </button>
        </div>
      </div>

      {/* ── Entrées KPI ── */}
      {entreesJour && (
        <div style={{ display:'flex', gap:16, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, padding:'8px 14px', borderRadius:8, background:'var(--gray-50)', border:'1px solid var(--gray-200)' }}>
            <span style={{ fontSize:18, fontWeight:700, color:'var(--primary)' }}>{entreesJour.aujourdhui}</span>
            <span style={{ fontSize:12, color:'var(--gray-500)' }}>entrée{entreesJour.aujourdhui === 1 ? '' : 's'} aujourd'hui</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, padding:'8px 14px', borderRadius:8, background:'var(--gray-50)', border:'1px solid var(--gray-200)' }}>
            <span style={{ fontSize:18, fontWeight:700, color:'var(--primary)' }}>{entreesJour.cetteSemaine}</span>
            <span style={{ fontSize:12, color:'var(--gray-500)' }}>entrée{entreesJour.cetteSemaine === 1 ? '' : 's'} cette semaine</span>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="stock-filters-panel">
        <div className="stock-filters-header">
          <SlidersHorizontal size={14} color="var(--gray-400)" style={{ flexShrink:0 }} />
          <span>Filtres</span>
        </div>

        <div className="stock-filters-grid">
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

          <label className="stock-filter-field">
            <span className="stock-filter-label">N° BAD</span>
            <input
              value={bad}
              onChange={e=>{setBad(e.target.value);setPage(1);}}
              placeholder="N° BAD…"
              className="stock-filter-control"
            />
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">N° Acquit</span>
            <input
              value={acquit}
              onChange={e=>{setAcquit(e.target.value);setPage(1);}}
              placeholder="N° acquittement…"
              className="stock-filter-control"
            />
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">Port de chargement</span>
            <input
              value={port}
              onChange={e=>{setPort(e.target.value);setPage(1);}}
              placeholder="Port chargement…"
              className="stock-filter-control"
            />
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">Site</span>
            <select value={site} onChange={e=>{setSite(e.target.value);setPage(1);}} className="stock-filter-control">
              <option value="">Tous les sites</option>
              {sites.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">Activité</span>
            <select value={activite} onChange={e=>{setActivite(e.target.value);setPage(1);}} className="stock-filter-control">
              <option value="">Toutes les activités</option>
              {activites.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">Pesage</span>
            <select
              value={pesage === undefined ? '' : pesage ? 'oui' : 'non'}
              onChange={e => { setPesage(e.target.value === '' ? undefined : e.target.value === 'oui'); setPage(1); }}
              className="stock-filter-control"
            >
              <option value="">Tous</option>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
            </select>
          </label>

          <label className="stock-filter-field">
            <span className="stock-filter-label">Visite</span>
            <select
              value={visiteCode ?? ''}
              onChange={e => { setVisiteCode(e.target.value === '' ? undefined : Number(e.target.value)); setPage(1); }}
              className="stock-filter-control"
            >
              <option value="">Tous</option>
              <option value={VISITE_CODES[0]}>Douanière</option>
              <option value={VISITE_CODES[1]}>Partielle</option>
              <option value={VISITE_CODES[2]}>Intégrale</option>
            </select>
          </label>

          <div className="stock-filter-field stock-date-range-field">
            <span className="stock-filter-label">Date d'entrée (journée ou période)</span>
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
            <div className="stock-filter-actions">
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
          <Package size={40} style={{ color:'var(--gray-300)', marginBottom:12 }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--gray-600)' }}>Aucun conteneur trouvé</p>
          <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:4 }}>
            {hasFilters ? 'Essayez de modifier vos filtres.' : 'Il n\'y a aucun conteneur en stock.'}
          </p>
        </div>
      ) : (
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Table header info */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)' }}>
              {data.totalCount.toLocaleString('fr-FR')} conteneur{data.totalCount > 1 ? 's' : ''}
              {hasFilters && <span style={{ color:'var(--primary)' }}> · filtrés</span>}
            </span>
            <span style={{ fontSize:12, color:'var(--gray-400)' }}>Page {page}/{totalPages}</span>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--gray-50)', borderBottom:'1px solid var(--gray-200)' }}>
                  {([
                    { label:'Conteneur', key:'conteneur' },
                    { label:'Site',      key:'site' },
                    { label:'Type / Taille', key:null },
                    { label:'Activité',  key:null },
                    { label:'Transport', key:null },
                    { label:'Entrée',    key:'entree' },
                    { label:'Jours',     key:'jours' },
                    { label:'N° Acquit', key:null },
                    { label:'Pesage',    key:null },
                    { label:'Visite',    key:null },
                  ] as { label: string; key: string | null }[]).map(col => {
                    const isActive = col.key && sortBy === col.key;
                    const center = col.label === 'Jours' || col.label === 'Pesage' || col.label === 'Visite';
                    return (
                      <th
                        key={col.label}
                        onClick={col.key ? () => {
                          if (sortBy === col.key) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
                          else { setSortBy(col.key!); setSortDir('ASC'); }
                          setPage(1);
                        } : undefined}
                        style={{
                          padding:'9px 14px', textAlign: center ? 'center' : 'left',
                          fontSize:11, fontWeight:700, textTransform:'uppercase',
                          letterSpacing:'0.5px', whiteSpace:'nowrap',
                          color: isActive ? 'var(--primary)' : 'var(--gray-500)',
                          cursor: col.key ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
                          {col.label}
                          {col.key && (isActive
                            ? (sortDir === 'ASC' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>)
                            : <ChevronDown size={11} style={{ opacity:0.25 }}/>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.items.map((c, i) => (
                  <tr
                    key={c.numeroConteneur}
                    onClick={() => navigate(`/conteneurs/${c.numeroConteneur}`)}
                    style={{ borderBottom: i < data.items.length - 1 ? '1px solid var(--gray-100)' : 'none', cursor:'pointer', transition:'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--oncf-orange-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:700, fontSize:12, color:'var(--gray-800)' }}>{c.numeroConteneur}</span>
                      {c.numeroBAD && <div style={{ fontSize:10, color:'var(--gray-400)', marginTop:1 }}>BAD {c.numeroBAD}</div>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:12, color:'var(--gray-800)' }}>{c.siteLibelle}</div>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1 }}>{c.ville}</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:12, color:'var(--gray-700)' }}>{c.typeConteneur}</span>
                      <span style={{ fontSize:11, color:'var(--gray-400)', marginLeft:6 }}>{c.tailleConteneur}</span>
                    </td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:12 }}>{c.typeActivite || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      {c.moyenTransport
                        ? <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4,
                            background: c.moyenTransport === 'Train' ? '#f0fdf4' : '#eff6ff',
                            color:      c.moyenTransport === 'Train' ? '#16a34a' : '#2563eb' }}>
                            {c.moyenTransport}
                          </span>
                        : <span style={{ fontSize:11, color:'var(--gray-300)' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-600)', fontSize:12, whiteSpace:'nowrap' }}>{fmt(c.dateEntree)}</td>
                    <td style={{ padding:'11px 14px', textAlign:'center' }}><DaysBadge days={c.nombreJoursStockage} /></td>
                    <td style={{ padding:'11px 14px', color:'var(--gray-500)', fontSize:11, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>{c.numeroAcquitement || '—'}</td>
                    <td style={{ padding:'11px 14px', textAlign:'center' }}>
                      {c.hasPesage
                        ? <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background:'#f0fdf4', color:'#16a34a' }}>Oui</span>
                        : <span style={{ fontSize:11, color:'var(--gray-300)' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 14px', textAlign:'center' }}>
                      {c.typeVisite
                        ? <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background:'#eff6ff', color:'#2563eb', whiteSpace:'nowrap' }}>{c.typeVisite}</span>
                        : <span style={{ fontSize:11, color:'var(--gray-300)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
              <span style={{ fontSize:12, color:'var(--gray-500)' }}>Page {page} sur {totalPages}</span>
              <div style={{ display:'flex', gap:4 }}>
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, cursor:page<=1?'not-allowed':'pointer', opacity:page<=1?0.4:1 }}>
                  <ChevronLeft size={13}/> Précédent
                </button>
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', border:'1px solid var(--gray-200)', borderRadius:7, background:'white', color:'var(--gray-600)', fontSize:12, cursor:page>=totalPages?'not-allowed':'pointer', opacity:page>=totalPages?0.4:1 }}>
                  Suivant <ChevronRight size={13}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
