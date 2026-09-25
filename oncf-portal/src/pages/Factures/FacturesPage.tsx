import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFactures, getFacturePdfPath, downloadPdf } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagedData } from '../../hooks/usePagedData';
import { PAGE_SIZE } from '../../constants';
import type { Facture } from '../../types';
import { Download, FileText, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useAuth } from '../../contexts/AuthContext';

const STATUTS = [
  { value: '',           label: 'Tous les statuts' },
  { value: 'PREVALIDEE', label: 'Pré-Facture' },
  { value: 'VALIDEE',    label: 'Facture validée' },
];

function StatutPill({ statut }: Readonly<{ statut: string }>) {
  if (statut === 'PREVALIDEE')
    return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#fef3c7', color:'#92400e', textTransform:'uppercase', letterSpacing:'0.4px' }}>● Pré-Facture</span>;
  if (statut === 'VALIDEE')
    return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#dcfce7', color:'#166534', textTransform:'uppercase', letterSpacing:'0.4px' }}>✓ Validée</span>;
  if (statut === 'ANNULEE')
    return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#fee2e2', color:'#991b1b', textTransform:'uppercase', letterSpacing:'0.4px' }}>✗ Annulée</span>;
  return <span className="badge">{statut}</span>;
}

export default function FacturesPage() {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statut, setStatut]     = useState('');
  const [acquit, setAcquit]     = useState('');
  const debouncedSearch         = useDebounce(search);
  const debouncedAcquit         = useDebounce(acquit);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const location    = useLocation();
  const navigate    = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName } = useAuth();
  const clientCode  = queryParams.get('clientCode') || authClientCode || '';
  const clientName  = queryParams.get('clientName') || authClientName || '';
  const pageSize    = PAGE_SIZE;

  const { data, loading, error, load: fetchData } = usePagedData<Facture>(
    () => getFactures(clientCode, page, pageSize, statut || undefined, debouncedSearch || undefined, dateFrom || undefined, dateTo || undefined, debouncedAcquit || undefined),
    [clientCode, page, debouncedSearch, statut, dateFrom, dateTo, debouncedAcquit],
  );

  useEffect(() => {
    if (!clientCode) { navigate(isAdmin ? '/admin' : '/'); return; }
    fetchData();
  }, [clientCode, fetchData, isAdmin, navigate]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const fmtM = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DH';

  const openPdf = async (e: React.MouseEvent, f: Facture) => {
    e.stopPropagation();
    setPdfLoadingId(f.factureId);
    try {
      await downloadPdf(getFacturePdfPath(f.factureId), `Facture_${f.numeroFacture}.pdf`);
    } catch { /* silently ignore */ }
    finally { setPdfLoadingId(null); }
  };

  // Summary stats
  const prevalidees = data?.items.filter(f => f.statut === 'PREVALIDEE').length ?? 0;
  const totalTTC    = data?.items.reduce((s, f) => s + f.montantTTC, 0) ?? 0;

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-header-left">
          <div className="page-header-icon">
            <FileText size={18} color="var(--primary)" />
          </div>
          <div>
            <h1 className="page-title-sm">Factures & Pré-Factures</h1>
            <span className="page-client-label">{clientName || clientCode}</span>
          </div>
        </div>
      </div>

      {/* ── KPI summary strip ── */}
      {data && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:8, padding:'14px 18px', borderLeft:'3px solid var(--primary)' }}>
            <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total factures</div>
            <div style={{ fontSize:26, fontWeight:700, color:'var(--primary)', marginTop:4 }}>{data.totalCount}</div>
          </div>
          <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:8, padding:'14px 18px', borderLeft:'3px solid #f59e0b' }}>
            <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Pré-factures (cette page)</div>
            <div style={{ fontSize:26, fontWeight:700, color:'#92400e', marginTop:4 }}>{prevalidees}</div>
          </div>
          <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:8, padding:'14px 18px', borderLeft:'3px solid #16a34a' }}>
            <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total TTC (cette page)</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#166534', marginTop:4 }}>{fmtM(totalTTC)}</div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:8, padding:'14px 16px', marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <SlidersHorizontal size={14} color="var(--gray-400)" />
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)' }} />
          <input
            type="text"
            placeholder="N° facture, conteneurs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width:'100%', padding:'7px 10px 7px 32px', border:'1px solid var(--gray-300)', borderRadius:6, fontSize:13, outline:'none' }}
          />
        </div>
        <input
          type="text"
          placeholder="N° Acquit..."
          value={acquit}
          onChange={e => { setAcquit(e.target.value); setPage(1); }}
          style={{ padding:'7px 10px', border:'1px solid var(--gray-300)', borderRadius:6, fontSize:13, minWidth:140, outline:'none' }}
        />
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value); setPage(1); }}
          style={{ padding:'7px 12px', border:'1px solid var(--gray-300)', borderRadius:6, fontSize:13, background:'white', minWidth:150 }}
        >
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--gray-500)' }}>
          <span>Du</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding:'7px 10px', border:'1px solid var(--gray-300)', borderRadius:6, fontSize:13, background:'white' }} />
          <span>au</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding:'7px 10px', border:'1px solid var(--gray-300)', borderRadius:6, fontSize:13, background:'white' }} />
        </div>
      </div>

      {/* ── Content ── */}
      {error && <ErrorBanner onRetry={fetchData} />}
      {loading ? (
        <PageSpinner />
      ) : !data || data.items.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--gray-400)' }}>
          <FileText size={40} style={{ marginBottom:12, opacity:0.2 }} />
          <p style={{ fontSize:15, fontWeight:600 }}>Aucune facture trouvée</p>
          <p style={{ fontSize:13, marginTop:4 }}>Modifiez vos filtres pour afficher des résultats</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:8 }}>{data.totalCount} facture(s)</div>

          <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:8, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--gray-50)' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', whiteSpace:'nowrap' }}>N° Facture</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)' }}>Statut</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)' }}>Type</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', whiteSpace:'nowrap' }}>Date</th>
                  <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', whiteSpace:'nowrap' }}>Montant HT</th>
                  <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)' }}>TVA</th>
                  <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', whiteSpace:'nowrap' }}>Total TTC</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', width:60 }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((f, i) => (
                  <tr
                    key={f.factureId}
                    onClick={() => navigate(`/factures/${f.factureId}`)}
                    style={{ cursor:'pointer', borderBottom: i < data.items.length - 1 ? '1px solid var(--gray-100)' : 'none', transition:'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600, color:'var(--gray-800)', fontSize:13 }}>{f.numeroFacture}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}><StatutPill statut={f.statut} /></td>
                    <td style={{ padding:'12px 14px', color:'var(--gray-600)' }}>{f.typeFacture || '—'}</td>
                    <td style={{ padding:'12px 14px', color:'var(--gray-500)', fontSize:12, whiteSpace:'nowrap' }}>
                      {fmt(f.dateValidation || f.dateDebutPeriode)}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right', color:'var(--gray-700)', fontVariantNumeric:'tabular-nums' }}>
                      {f.montantHT.toLocaleString('fr-FR', { minimumFractionDigits:2 })}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right', color:'var(--gray-500)', fontSize:12, fontVariantNumeric:'tabular-nums' }}>
                      {f.montantTVA > 0 ? f.montantTVA.toLocaleString('fr-FR', { minimumFractionDigits:2 }) : <em>Exo</em>}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color: f.montantTTC < 0 ? 'var(--danger)' : 'var(--gray-900)', fontVariantNumeric:'tabular-nums' }}>
                      {fmtM(f.montantTTC)}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'center' }} onClick={e => openPdf(e, f)}>
                      <button
                        style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:6, border:'1px solid var(--gray-300)', background:'white', cursor: pdfLoadingId === f.factureId ? 'wait' : 'pointer', color:'var(--primary)', transition:'all 0.15s' }}
                        title="Télécharger PDF"
                        disabled={pdfLoadingId === f.factureId}
                        onMouseEnter={e => { if (!pdfLoadingId) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        {pdfLoadingId === f.factureId ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:16 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding:'6px 16px', border:'1px solid var(--gray-300)', borderRadius:6, background:'white', cursor:'pointer', fontSize:13, color:'var(--gray-700)', opacity: page <= 1 ? 0.4 : 1 }}>
              ← Précédent
            </button>
            <span style={{ fontSize:13, color:'var(--gray-500)' }}>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding:'6px 16px', border:'1px solid var(--gray-300)', borderRadius:6, background:'white', cursor:'pointer', fontSize:13, color:'var(--gray-700)', opacity: page >= totalPages ? 0.4 : 1 }}>
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
