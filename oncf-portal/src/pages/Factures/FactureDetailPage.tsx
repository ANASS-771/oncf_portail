import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFactureDetail, getFacturePdfPath, downloadPdf } from '../../api/client';
import type { FactureDetail } from '../../types';
import { ArrowLeft, Download, FileText, Calendar, Hash, User, Package, Box, ArrowUpRight, Loader2 } from 'lucide-react';

function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div style={{ display:'flex', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', gap:12, alignItems:'flex-start' }}>
      <span style={{ width:150, flexShrink:0, fontSize:12, color:'var(--gray-500)', fontWeight:600, paddingTop:1 }}>{label}</span>
      <span style={{ fontSize:13, color:'var(--gray-800)', flex:1 }}>{value}</span>
    </div>
  );
}

function Card({ title, icon, children }: Readonly<{ title: string; icon: React.ReactNode; children: React.ReactNode }>) {
  return (
    <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
        <span style={{ color:'var(--primary)' }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</span>
      </div>
      <div style={{ padding:'4px 16px 12px' }}>{children}</div>
    </div>
  );
}

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<FactureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getFactureDetail(Number(id))
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const fmtM = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DH';

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:'var(--gray-400)' }}>
      <FileText size={36} style={{ opacity:0.3 }} />
      <p>Chargement de la facture...</p>
    </div>
  );

  if (!detail) return (
    <div style={{ textAlign:'center', padding:80, color:'var(--gray-400)' }}>
      <p style={{ fontSize:16, fontWeight:600 }}>Facture introuvable.</p>
      <button onClick={() => navigate('/factures')} style={{ marginTop:12, padding:'8px 18px', border:'1px solid var(--gray-300)', borderRadius:6, background:'white', cursor:'pointer', fontSize:13 }}>
        Retour aux factures
      </button>
    </div>
  );

  const { facture: f, lignes, conteneursLies } = detail;
  const isProforma = !f.dateValidation;
  // Max nbreTC across lines = the "totaling" line (e.g. Manutention covers all TCs).
  // Used to show a TC count when the Factures.Conteneurs text blob is incomplete.
  const totalTC = lignes.length > 0 ? Math.max(...lignes.map(l => l.nbreTC || 0)) : 0;

  return (
    <div className="page" style={{ maxWidth:1100 }}>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button className="btn-back" onClick={() => navigate('/factures')}>
          <ArrowLeft size={14} /> Factures
        </button>

        {/* Document title badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px',
          borderRadius:20, fontWeight:700, fontSize:13, letterSpacing:'0.5px',
          background: isProforma ? '#fef3c7' : '#dcfce7',
          color: isProforma ? '#92400e' : '#166534',
          border: `1px solid ${isProforma ? '#fde68a' : '#bbf7d0'}`
        }}>
          <FileText size={14} />
          {isProforma ? 'PRÉ-FACTURE' : 'FACTURE'}
        </div>

        <span style={{ fontFamily:'ui-monospace,monospace', fontSize:16, fontWeight:700, color:'var(--gray-800)' }}>
          {f.numeroFacture}
        </span>

        <div style={{ marginLeft:'auto' }}>
          <button
            onClick={async () => {
              setPdfLoading(true);
              try {
                const prefix = isProforma ? 'PreFacture' : 'Facture';
                await downloadPdf(getFacturePdfPath(f.factureId), `${prefix}_${f.numeroFacture}.pdf`);
              } catch { /* silently ignore */ }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--primary)', color:'white', border:'none', borderRadius:7, cursor: pdfLoading ? 'wait' : 'pointer', fontSize:13, fontWeight:600, opacity: pdfLoading ? 0.7 : 1 }}
          >
            {pdfLoading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
            {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      {/* ── Amount summary banner ── */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
        gap:0, marginBottom:20, borderRadius:10, overflow:'hidden',
        border:'1px solid var(--gray-200)'
      }}>
        <div style={{ padding:'18px 24px', background:'white', borderRight:'1px solid var(--gray-200)' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-400)', marginBottom:6 }}>Montant HT</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--gray-800)', fontVariantNumeric:'tabular-nums' }}>
            {f.montantHT.toLocaleString('fr-FR', { minimumFractionDigits:2 })} <span style={{ fontSize:13, fontWeight:400, color:'var(--gray-400)' }}>DH</span>
          </div>
        </div>
        <div style={{ padding:'18px 24px', background:'white', borderRight:'1px solid var(--gray-200)' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-400)', marginBottom:6 }}>TVA</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--gray-800)', fontVariantNumeric:'tabular-nums' }}>
            {f.montantTVA > 0
              ? <>{f.montantTVA.toLocaleString('fr-FR', { minimumFractionDigits:2 })} <span style={{ fontSize:13, fontWeight:400, color:'var(--gray-400)' }}>DH</span></>
              : <span style={{ fontSize:14, color:'var(--gray-400)', fontWeight:500 }}>Exonéré</span>
            }
          </div>
        </div>
        <div style={{ padding:'18px 24px', background: isProforma ? '#fffbeb' : '#f0fdf4' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color: isProforma ? '#92400e' : '#166534', marginBottom:6 }}>Total TTC</div>
          <div style={{ fontSize:26, fontWeight:800, color: isProforma ? '#92400e' : '#166534', fontVariantNumeric:'tabular-nums' }}>
            {f.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits:2 })} <span style={{ fontSize:13, fontWeight:500 }}>DH</span>
          </div>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

        <Card title="Informations" icon={<Hash size={14} />}>
          <InfoRow label="N° Facture"     value={<span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600 }}>{f.numeroFacture}</span>} />
          <InfoRow label="Type"           value={f.typeFacture || '—'} />
          <InfoRow label="Date validation" value={fmt(f.dateValidation)} />
        </Card>

        <Card title="Client" icon={<User size={14} />}>
          <InfoRow label="Code"      value={<span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600 }}>{f.clientCode}</span>} />
          {f.ice           && <InfoRow label="ICE"        value={f.ice} />}
          {f.telephoneClient && <InfoRow label="Téléphone"  value={f.telephoneClient} />}
        </Card>

        {(f.numAcquits || f.connaissements || f.conteneurs) && (
          <Card title="Références" icon={<Package size={14} />}>
            {f.numAcquits     && <InfoRow label="N° Acquits"     value={f.numAcquits} />}
            {f.connaissements && <InfoRow label="Connaissements" value={f.connaissements} />}
            {f.conteneurs     && (
              <InfoRow
                label="Réf. conteneur(s)"
                value={
                  <div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:4 }}>
                      {(f.conteneurs.match(/[A-Za-z0-9]{10,12}/g) || []).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                        <span key={c} style={{ fontFamily:'ui-monospace,monospace', fontSize:11, fontWeight:600, background:'var(--gray-100)', color:'var(--gray-700)', borderRadius:4, padding:'2px 6px' }}>
                          {c.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize:11, color:'var(--gray-400)', fontStyle:'italic' }}>
                      Conteneurs associés à cette facture
                    </span>
                  </div>
                }
              />
            )}
            {totalTC > 0 && (
              <InfoRow
                label="TC facturés"
                value={
                  <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:700, fontSize:13, color:'var(--gray-800)' }}>
                    {totalTC}
                    <span style={{ fontFamily:'sans-serif', fontWeight:400, fontSize:11, color:'var(--gray-400)', marginLeft:6 }}>
                      (d&apos;après lignes de facturation)
                    </span>
                  </span>
                }
              />
            )}
          </Card>
        )}

        {detail.factureParent && (
          <Card title="Facture parente" icon={<FileText size={14} />}>
            <div style={{ paddingTop:8 }}>
              <p style={{ fontSize:13, color:'var(--gray-600)', marginBottom:8 }}>Cette facture est un avoir lié à :</p>
              <button onClick={() => navigate(`/factures/${detail.factureParent!.factureId}`)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', border:'1px solid var(--primary)', borderRadius:6, background:'var(--primary-bg)', color:'var(--primary)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                {detail.factureParent.numeroFacture} — {fmtM(detail.factureParent.montantTTC)}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Conteneurs liés ── */}
      {conteneursLies.length > 0 && (
        <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
            <Box size={14} color="var(--primary)" />
            <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Conteneurs facturés
            </span>
            <span style={{ marginLeft:'auto', fontSize:12, color:'var(--gray-400)', background:'var(--gray-200)', borderRadius:20, padding:'2px 8px' }}>
              {conteneursLies.length} conteneur{conteneursLies.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'14px 16px' }}>
            {conteneursLies.map(c => {
              const inPortal = c.statutConteneur !== null;
              const isSorti  = c.statutConteneur === 'SORTI';
              return (
                <button
                  key={c.numeroConteneur}
                  onClick={() => inPortal && navigate(`/conteneurs/${c.numeroConteneur}`)}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                    fontFamily:'ui-monospace,monospace', cursor: inPortal ? 'pointer' : 'default',
                    border: `1px solid ${isSorti ? 'var(--gray-300)' : inPortal ? 'var(--primary)' : 'var(--gray-300)'}`,
                    background: isSorti ? 'var(--gray-50)' : inPortal ? 'var(--primary-bg)' : 'white',
                    color: isSorti ? 'var(--gray-400)' : inPortal ? 'var(--primary)' : 'var(--gray-500)',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if (inPortal) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; } }}
                  onMouseLeave={e => { if (inPortal) { e.currentTarget.style.background = isSorti ? 'var(--gray-50)' : 'var(--primary-bg)'; e.currentTarget.style.color = isSorti ? 'var(--gray-400)' : 'var(--primary)'; } }}
                  title={
                    !inPortal ? 'Conteneur non trouvé dans le portail' :
                    isSorti ? `Sorti le ${fmt(c.dateSortie)} — ${c.siteLibelle}` :
                    `En stock — ${c.siteLibelle}, ${c.ville}`
                  }
                >
                  {c.numeroConteneur}
                  {inPortal && !isSorti && <span style={{ fontSize:9, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'1px 4px', fontFamily:'sans-serif', fontWeight:700 }}>EN STOCK</span>}
                  {isSorti && <span style={{ fontSize:9, background:'var(--gray-200)', color:'var(--gray-500)', borderRadius:4, padding:'1px 4px', fontFamily:'sans-serif', fontWeight:700 }}>SORTI</span>}
                  {!inPortal && <span style={{ fontSize:9, background:'#fef3c7', color:'#92400e', borderRadius:4, padding:'1px 4px', fontFamily:'sans-serif', fontWeight:700 }}>Non suivi</span>}
                  {inPortal && <ArrowUpRight size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lines table ── */}
      <div style={{ background:'white', border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'1px solid var(--gray-100)', background:'var(--gray-50)' }}>
          <Calendar size={14} color="var(--primary)" />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Lignes de facturation
          </span>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--gray-400)', background:'var(--gray-200)', borderRadius:20, padding:'2px 8px' }}>
            {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
          </span>
        </div>

        {lignes.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Aucune ligne de détail</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--gray-50)' }}>
                  {['N°', 'Désignation', 'TC', 'Qté', 'P.U HT', 'Montant HT', 'TVA%', 'Montant TTC'].map(h => (
                    <th key={h} style={{ padding:'9px 12px', textAlign: ['P.U HT','Montant HT','Montant TTC'].includes(h) ? 'right' : 'center', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', borderBottom:'1px solid var(--gray-200)', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={l.ligneId} style={{ background: i % 2 === 0 ? 'white' : 'var(--gray-50)', borderBottom:'1px solid var(--gray-100)' }}>
                    <td style={{ padding:'10px 12px', textAlign:'center', color:'var(--gray-400)', fontWeight:600 }}>{l.numLigne}</td>
                    <td style={{ padding:'10px 12px', color:'var(--gray-800)' }}>{l.designation}</td>
                    <td style={{ padding:'10px 12px', textAlign:'center', color:'var(--gray-600)' }}>{l.nbreTC > 0 ? l.nbreTC : '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{l.quantite.toLocaleString('fr-FR', { minimumFractionDigits:2 })}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', color:'var(--gray-600)' }}>{l.prixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits:2 })}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:500 }}>{l.montantHT.toLocaleString('fr-FR', { minimumFractionDigits:2 })}</td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      {l.tauxTVA > 0
                        ? <span style={{ padding:'2px 8px', borderRadius:4, background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:600 }}>{l.tauxTVA}%</span>
                        : <span style={{ padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'var(--gray-500)', fontSize:11, fontWeight:600 }}>Exo</span>
                      }
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums', color: l.montantTTC < 0 ? 'var(--danger)' : 'var(--gray-900)' }}>
                      {l.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits:2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: isProforma ? '#fffbeb' : '#f0fdf4', borderTop:'2px solid var(--gray-200)' }}>
                  <td colSpan={5} style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, fontSize:12, color:'var(--gray-600)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</td>
                  <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmtM(f.montantHT)}</td>
                  <td />
                  <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:800, fontSize:14, fontVariantNumeric:'tabular-nums', color: isProforma ? '#92400e' : '#166534' }}>{fmtM(f.montantTTC)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
