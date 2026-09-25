import { useState } from 'react';
import { ArrowLeft, Download, FileText, Hash, Loader2, Package, X } from 'lucide-react';
import { downloadFactureSimulee } from '../../api/client';
import type { AcquitInfo, SimulateurResponse } from '../../types';
import { buildSimuLines } from './buildSimuLines';

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

function SimuCard({ title, icon, children }: Readonly<{ title: string; icon: React.ReactNode; children: React.ReactNode }>) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 16px 12px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--gray-100)', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ width: 160, flexShrink: 0, fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--gray-800)', flex: 1 }}>{value}</span>
    </div>
  );
}

export function Step3Result({
  result,
  acquit,
  onModifier,
  onClose,
}: Readonly<{
  result: SimulateurResponse;
  acquit: AcquitInfo;
  onModifier: () => void;
  onClose: () => void;
}>) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadFactureSimulee(
        result.clientCode,
        result.dateSortieEstimee,
        acquit.numeroAcquit,
        result.conteneurs.map(c => c.numeroConteneur),
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const t = result.totaux;
  const persp = result.perspective ?? 'Admin';
  const lines = buildSimuLines(result);

  const perspBg    = persp === 'DonneurOrdre'     ? '#eff6ff'
                   : persp === 'DonneurOrdreFinal' ? '#fdf4ff'
                   : persp === 'ClientDirect'       ? '#fefce8'
                   : '#f0fdf4';
  const perspColor = persp === 'DonneurOrdre'     ? '#2563eb'
                   : persp === 'DonneurOrdreFinal' ? '#7c3aed'
                   : persp === 'ClientDirect'       ? '#92400e'
                   : '#166534';
  const perspBorder= persp === 'DonneurOrdre'     ? '#bfdbfe'
                   : persp === 'DonneurOrdreFinal' ? '#e9d5ff'
                   : persp === 'ClientDirect'       ? '#fde68a'
                   : '#bbf7d0';
  const perspLabel = persp === 'DonneurOrdre'
    ? "Donneur d'ordre — frais compagnie maritime (TVA exonérée)"
    : persp === 'DonneurOrdreFinal'
    ? "Donneur d'ordre et destinataire — magasinage + frais compagnie maritime"
    : persp === 'ClientDirect'
    ? "Client direct — magasinage + frais d'opérations"
    : "Client final — magasinage";

  const totalTVA = t.totalGeneral_TTC - t.totalGeneral_HT;

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onModifier} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)', fontWeight: 600 }}>
          <ArrowLeft size={13} /> Modifier la sélection
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid var(--primary)', borderRadius: 7, background: 'var(--primary)', fontSize: 12, cursor: pdfLoading ? 'wait' : 'pointer', color: 'white', fontWeight: 600, opacity: pdfLoading ? 0.7 : 1 }}
        >
          {pdfLoading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
          {pdfLoading ? 'Génération...' : 'Télécharger facture simulée'}
        </button>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #fecaca', borderRadius: 7, background: 'white', fontSize: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
          <X size={13} /> Fermer
        </button>
        {persp !== 'Admin' && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: perspBg, color: perspColor, border: `1px solid ${perspBorder}` }}>
            {perspLabel}
          </span>
        )}
      </div>

      {/* HT / TVA / TTC banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        <div style={{ padding: '18px 24px', background: 'white', borderRight: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: 6 }}>Montant HT</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(t.totalGeneral_HT)} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--gray-400)' }}>MAD</span>
          </div>
        </div>
        <div style={{ padding: '18px 24px', background: 'white', borderRight: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: 6 }}>TVA</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', fontVariantNumeric: 'tabular-nums' }}>
            {totalTVA > 0
              ? <>{fmt(totalTVA)} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--gray-400)' }}>MAD</span></>
              : <span style={{ fontSize: 14, color: 'var(--gray-400)', fontWeight: 500 }}>Exonéré</span>}
          </div>
        </div>
        <div style={{ padding: '18px 24px', background: '#fef6ee' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)', marginBottom: 6 }}>Total TTC</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(t.totalGeneral_TTC)} <span style={{ fontSize: 13, fontWeight: 500 }}>MAD</span>
          </div>
        </div>
      </div>

      {/* Metadata cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <SimuCard title="Simulation" icon={<FileText size={14} />}>
          <InfoRow label="Acquit N°"           value={<span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>{acquit.numeroAcquit}</span>} />
          {acquit.numeroConnaissement && (
            <InfoRow label="Connaissement"     value={<span style={{ fontFamily: 'ui-monospace,monospace', color: 'var(--gray-600)' }}>{acquit.numeroConnaissement}</span>} />
          )}
          <InfoRow label="Date sortie estimée" value={fmtDate(String(result.dateSortieEstimee))} />
          <InfoRow label="Date simulation"     value={fmtDate(String(result.dateSimulation))} />
        </SimuCard>
        <SimuCard title="Conteneurs" icon={<Package size={14} />}>
          <InfoRow label="Total"    value={`${t.nombreConteneurs} conteneur${t.nombreConteneurs > 1 ? 's' : ''}`} />
          <InfoRow label="20'"      value={String(t.nombreConteneurs20)} />
          <InfoRow label="40' / HC" value={String(t.nombreConteneurs40)} />
          <InfoRow label="Unités"   value={String(t.nombreUnites)} />
        </SimuCard>
      </div>

      {/* Container chips */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
          <Hash size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conteneurs simulés</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', background: 'var(--gray-200)', borderRadius: 20, padding: '2px 8px' }}>
            {result.conteneurs.length} conteneur{result.conteneurs.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 16px' }}>
          {result.conteneurs.map(c => {
            const is40 = c.typeTC === '40';
            return (
              <div key={c.numeroConteneur} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace,monospace', border: `1px solid ${is40 ? '#bfdbfe' : '#bbf7d0'}`, background: is40 ? '#eff6ff' : '#f0fdf4', color: is40 ? '#1d4ed8' : '#15803d' }}>
                {c.numeroConteneur}
                <span style={{ fontSize: 9, fontFamily: 'sans-serif', fontWeight: 700, opacity: 0.7 }}>{c.tailleConteneur} · {c.nombreJours}j</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing lines table */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
          <FileText size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lignes de facturation simulées</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', background: 'var(--gray-200)', borderRadius: 20, padding: '2px 8px' }}>
            {lines.filter(l => !l.isSurDevis).length} ligne{lines.filter(l => !l.isSurDevis).length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['N°', 'Désignation', 'TC', 'Qté', 'P.U. HT', 'Montant HT', 'TVA %', 'Montant TTC'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: ['P.U. HT', 'Montant HT', 'Montant TTC'].includes(h) ? 'right' : 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.num} style={{ background: i % 2 === 0 ? 'white' : 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', opacity: l.isSurDevis ? 0.65 : 1 }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 600 }}>{l.num}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-800)' }}>
                    {l.label}
                    {l.isSurDevis && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>Sur devis</span>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--gray-600)' }}>{l.tc ?? '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{l.isSurDevis ? '—' : l.qte.toLocaleString('fr-FR')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gray-600)' }}>{l.isSurDevis || l.pu === 0 ? '—' : fmt(l.pu)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{l.isSurDevis ? '—' : fmt(l.ht)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {l.tva > 0
                      ? <span style={{ padding: '2px 8px', borderRadius: 4, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600 }}>{l.tva}%</span>
                      : <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: 'var(--gray-500)', fontSize: 11, fontWeight: 600 }}>Exo</span>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--gray-900)' }}>{l.isSurDevis ? '—' : fmt(l.ttc)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#fef6ee', borderTop: '2px solid var(--gray-200)' }}>
                <td colSpan={5} style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</td>
                <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(t.totalGeneral_HT)} MAD</td>
                <td />
                <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>{fmt(t.totalGeneral_TTC)} MAD</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
