import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { getConteneurDetail, getDocumentPath, downloadPdf } from '../../api/client';
import type { ConteneurDetailResult } from '../../types';
import {
  ArrowLeft, Anchor, Box, Calendar, CheckCircle2,
  FileText, Loader2, MapPin, Package,
  Ship, TruckIcon, Weight,
} from 'lucide-react';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { ConteneurMovementsTab } from './ConteneurMovementsTab';
import { ConteneurPrestationsTab } from './ConteneurPrestationsTab';
import { ConteneurFacturesTab } from './ConteneurFacturesTab';
import { ConteneurSortiesTab } from './ConteneurSortiesTab';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function DaysBadge({ days }: Readonly<{ days: number }>) {
  const [bg, color] =
    days >= 30 ? ['#fef2f2', '#dc2626'] :
    days >= 15 ? ['#fffbeb', '#d97706'] :
    days >= 7  ? ['#eff6ff', '#2563eb'] :
                 ['#f0fdf4', '#16a34a'];
  return (
    <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:bg, color, fontVariantNumeric:'tabular-nums' }}>
      {days} jour{days !== 1 ? 's' : ''}
    </span>
  );
}

function StatusPill({ statut }: Readonly<{ statut: string }>) {
  const s = statut.toUpperCase();
  const [bg, color, label] =
    s === 'ENTREE' ? ['#dcfce7', '#16a34a', 'En stock']  :
    s === 'SORTI'  ? ['#f3f4f6', '#6b7280', 'Sorti']     :
                     ['#eff6ff', '#2563eb', statut];
  return (
    <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:bg, color }}>
      {label}
    </span>
  );
}

function InfoCard({ title, icon, children }: Readonly<{ title: string; icon: React.ReactNode; children: React.ReactNode }>) {
  return (
    <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 18px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
        <span style={{ color:'var(--primary)' }}>{icon}</span>
        <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-600)' }}>{title}</span>
      </div>
      <div style={{ padding:'4px 0' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', padding:'10px 18px', borderBottom:'1px solid var(--gray-50)', flexWrap:'wrap', gap:'2px 0' }}>
      <span style={{ fontSize:12, color:'var(--gray-400)', minWidth:130, width:160, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:'var(--gray-800)', fontWeight:500, flex:1, minWidth:0 }}>{value || '—'}</span>
    </div>
  );
}

function DocBtn({ label, sublabel, loading, onClick }: Readonly<{ label: string; sublabel?: string; loading: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display:'inline-flex', alignItems:'center', gap:8,
        padding:'9px 16px', border:'1px solid var(--oncf-orange-border)',
        borderRadius:9, background:'var(--oncf-orange-bg)', color:'var(--primary)',
        fontSize:12, fontWeight:600, cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1, transition:'all 0.15s',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.color='white'; } }}
      onMouseLeave={e => { e.currentTarget.style.background='var(--oncf-orange-bg)'; e.currentTarget.style.color='var(--primary)'; }}
    >
      {loading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <FileText size={14} />}
      <span>
        <div>{label}</div>
        {sublabel && <div style={{ fontSize:10, opacity:0.7, fontWeight:400 }}>{sublabel}</div>}
      </span>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = 'base' | 'douane' | 'sorties' | 'mouvements' | 'factures' | 'prestations';

export default function ConteneurPage() {
  const { numero } = useParams<{ numero: string }>();
  const location   = useLocation();
  const navigate   = useNavigate();
  const qp         = new URLSearchParams(location.search);
  const initialTab = (qp.get('tab') as Tab) || 'base';
  const selectedSortieId = qp.get('sortieId');

  const [data, setData]       = useState<ConteneurDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [pdfKey, setPdfKey]   = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>(initialTab);

  useEffect(() => {
    if (!numero) return;
    getConteneurDetail(numero)
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [numero]);

  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const dl = async (key: string, path: string, filename: string) => {
    setPdfKey(key);
    try { await downloadPdf(path, filename); } catch { /* silent */ } finally { setPdfKey(null); }
  };

  if (loading) return <PageSpinner />;
  if (error) return (
    <div style={{ padding:40 }}>
      <ErrorBanner onRetry={() => {
        setError(false); setLoading(true);
        getConteneurDetail(numero!).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
      }} />
    </div>
  );
  if (!data) return (
    <div style={{ padding:60, textAlign:'center', color:'var(--gray-400)' }}>
      <Package size={40} style={{ marginBottom:12, opacity:0.3 }} />
      <p style={{ fontSize:15, fontWeight:600 }}>Conteneur introuvable.</p>
    </div>
  );

  const c   = data.conteneur;
  const det = data.detail;
  const days      = c.nombreJoursStockage;
  const isExited  = !!c.dateSortie;
  const isInStock = !isExited;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'base',        label: 'Informations'                              },
    { key: 'douane',      label: 'Douane'                                    },
    { key: 'sorties',     label: `Sorties (${data.sorties.length})`          },
    { key: 'mouvements',  label: `Mouvements (${data.mouvements.length})`    },
    { key: 'prestations', label: `Prestations (${data.operations.length})`   },
    ...(data.facturesLiees?.length > 0 ? [{ key: 'factures' as Tab, label: `Factures (${data.facturesLiees.length})` }] : []),
  ];

  return (
    <div className="page" style={{ maxWidth:1000 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', border:'1px solid var(--gray-200)', borderRadius:8, background:'white', color:'var(--gray-600)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-600)'; }}
          >
            <ArrowLeft size={13} /> Retour
          </button>
          <div style={{ width:42, height:42, borderRadius:11, background:'var(--oncf-orange-bg)', border:'1px solid var(--oncf-orange-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Box size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'var(--gray-900)', fontFamily:'ui-monospace,monospace', letterSpacing:'-0.3px' }}>
                {c.numeroConteneur}
              </h1>
              <StatusPill statut={c.statutLogistique} />
            </div>
            <span style={{ fontSize:12, color:'var(--gray-400)' }}>
              {c.siteLibelle} · {c.ville}
            </span>
          </div>
        </div>

        {isInStock && days > 0 && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:4 }}>En stock depuis</div>
            <DaysBadge days={days} />
          </div>
        )}
      </div>

      {/* ── Exit banner ── */}
      {isExited && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', marginBottom:16, background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:10 }}>
          <CheckCircle2 size={16} color="#6b7280" />
          <span style={{ fontSize:13, color:'#374151' }}>
            Sorti le <strong>{fmt(c.dateSortie)}</strong> — durée de stockage : <strong>{days} jour{days !== 1 ? 's' : ''}</strong>
          </span>
        </div>
      )}

      {/* ── Documents ── */}
      {(c.numeroBAD || data.sorties.length > 0) && (
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, padding:'12px 18px', marginBottom:20, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <FileText size={13} color="var(--primary)" />
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)' }}>Documents disponibles</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {c.numeroBAD && (
              <DocBtn
                label="Fiche BAD"
                sublabel={c.numeroBAD}
                loading={pdfKey === 'bad'}
                onClick={() => dl('bad', getDocumentPath('bad', c.numeroConteneur), `BAD_${c.numeroConteneur}.pdf`)}
              />
            )}
            {data.sorties[0]?.numBLC && (
              <DocBtn
                label="Bon de Livraison"
                sublabel={data.sorties[0].numBLC ?? undefined}
                loading={pdfKey === 'blc'}
                onClick={() => dl('blc', getDocumentPath('blc', data.sorties[0].id), `BLC_${data.sorties[0].numBLC}.pdf`)}
              />
            )}
            {data.sorties[0]?.numBonSortie && (
              <DocBtn
                label="Bon de Sortie"
                sublabel={data.sorties[0].numBonSortie ?? undefined}
                loading={pdfKey === 'bon-sortie'}
                onClick={() => dl('bon-sortie', getDocumentPath('bon-sortie', data.sorties[0].id), `BonSortie_${data.sorties[0].numBonSortie}.pdf`)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:'2px solid var(--gray-200)', flexWrap:'wrap', overflowX:'auto' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'9px 16px', fontSize:13, fontWeight:600,
              border:'none', borderBottom:`2px solid ${tab === t.key ? 'var(--primary)' : 'transparent'}`,
              marginBottom:'-2px', background:'transparent', cursor:'pointer',
              color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
              borderRadius:'4px 4px 0 0', transition:'color 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Informations ── */}
      {tab === 'base' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:14 }}>
          <InfoCard title="Identification" icon={<Package size={13} />}>
            <InfoRow label="Numéro" value={<span style={{ fontFamily:'ui-monospace,monospace', fontWeight:700 }}>{c.numeroConteneur}</span>} />
            <InfoRow label="Type / Taille" value={`${c.typeConteneur} · ${c.tailleConteneur}`} />
            <InfoRow label="N° BAD" value={c.numeroBAD ? <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600, color:'var(--gray-700)' }}>{c.numeroBAD}</span> : null} />
            <InfoRow label="Activité" value={c.typeActivite} />
            <InfoRow label="Stockage" value={c.typeStockage} />
            {c.portChargement && <InfoRow label="Port chargement" value={c.portChargement} />}
          </InfoCard>

          <InfoCard title="Logistique" icon={<MapPin size={13} />}>
            <InfoRow label="Site" value={<><span style={{ fontWeight:600 }}>{c.siteLibelle}</span> <span style={{ color:'var(--gray-400)', fontSize:12 }}>{c.ville}</span></>} />
            <InfoRow label="Client" value={<span style={{ fontFamily:'ui-monospace,monospace', fontSize:12 }}>{c.clientCode}</span>} />
            <InfoRow label="Statut" value={<StatusPill statut={c.statutLogistique} />} />
            <InfoRow label="Date d'entrée" value={<span style={{ display:'flex', alignItems:'center', gap:5 }}><Calendar size={12} color="var(--gray-400)" />{fmt(c.dateEntree)}</span>} />
            {isExited
              ? <InfoRow label="Date de sortie" value={<span style={{ display:'flex', alignItems:'center', gap:5 }}><TruckIcon size={12} color="#6b7280" />{fmt(c.dateSortie)}</span>} />
              : <InfoRow label="Durée en stock" value={<DaysBadge days={days} />} />
            }
            {isExited && (
              <InfoRow label="Durée totale" value={<DaysBadge days={days} />} />
            )}
          </InfoCard>
        </div>
      )}

      {/* ── Tab: Douane ── */}
      {tab === 'douane' && (
        det ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:14 }}>
            <InfoCard title="Références douanières" icon={<FileText size={13} />}>
              <InfoRow label="N° Demande"          value={det.numeroDemande} />
              <InfoRow label="Décl. Sommaire"       value={det.declarationSommaire} />
              <InfoRow label="Acquittement"         value={det.numeroAcquitement
                ? <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600 }}>{det.numeroAcquitement}</span>
                : null} />
              <InfoRow label="Date acquit"          value={fmt(det.dateAcquit)} />
              <InfoRow label="Connaissement"        value={det.numeroConnaissement} />
              {det.donneurOrdre && <InfoRow label="Donneur d'ordre"    value={<span style={{ fontFamily:'ui-monospace,monospace', fontSize:12 }}>{det.donneurOrdre}</span>} />}
              {det.clientFinal  && <InfoRow label="Client final"       value={<span style={{ fontFamily:'ui-monospace,monospace', fontSize:12 }}>{det.clientFinal}</span>} />}
            </InfoCard>

            <InfoCard title="Navire & marchandise" icon={<Ship size={13} />}>
              <InfoRow label="Navire"               value={det.navire ? <span style={{ display:'flex', alignItems:'center', gap:5 }}><Anchor size={12} color="var(--gray-400)" />{det.navire}</span> : null} />
              <InfoRow label="Port origine"         value={det.portOrigine} />
              <InfoRow label="Port arrivée"         value={det.portArrive} />
              <InfoRow label="Destinataire"         value={det.destinataire} />
              <InfoRow label="Marchandise"          value={det.natureMarchandise} />
              <InfoRow label="Code TAR"             value={det.codeTAR} />
              <InfoRow label="Poids brut"           value={det.poidsBrut != null ? <span style={{ display:'flex', alignItems:'center', gap:5 }}><Weight size={12} color="var(--gray-400)" />{det.poidsBrut.toLocaleString('fr-FR')} kg</span> : null} />
              <InfoRow label="Poids taré"           value={det.poidsTare != null ? `${det.poidsTare.toLocaleString('fr-FR')} kg` : null} />
            </InfoCard>
          </div>
        ) : (
          <div style={{ padding:60, textAlign:'center' }}>
            <Ship size={40} style={{ color:'var(--gray-300)', marginBottom:12 }} />
            <p style={{ fontSize:15, fontWeight:600, color:'var(--gray-600)' }}>Pas de données douanières</p>
            <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:4 }}>Aucune information douanière disponible pour ce conteneur.</p>
          </div>
        )
      )}

      {tab === 'sorties' && (
        <ConteneurSortiesTab
          sorties={data.sorties}
          selectedSortieId={selectedSortieId}
          pdfKey={pdfKey}
          onDownload={dl}
        />
      )}

      {tab === 'mouvements' && (
        <ConteneurMovementsTab mouvements={data.mouvements} />
      )}

      {tab === 'prestations' && (
        <ConteneurPrestationsTab operations={data.operations} />
      )}

      {tab === 'factures' && (
        <ConteneurFacturesTab
          factures={data.facturesLiees ?? []}
          onNavigate={id => navigate(`/factures/${id}`)}
        />
      )}

    </div>
  );
}
