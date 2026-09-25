import { useEffect, useState } from 'react';
import { ArrowLeft, Calculator, Loader2 } from 'lucide-react';
import { getSimulateurConteneurs } from '../../api/client';
import type { AcquitInfo, ConteneurSimuInfo } from '../../types';
import ErrorBanner from '../../components/ui/ErrorBanner';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

export function Step2Conteneurs({
  clientCode,
  acquit,
  onBack,
  onSimuler,
}: Readonly<{
  clientCode: string;
  acquit: AcquitInfo;
  onBack: () => void;
  onSimuler: (selected: string[], dateSortie: string) => void;
}>) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [conteneurs, setConteneurs] = useState<ConteneurSimuInfo[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [dateSortie, setDateSortie] = useState(todayIso);
  const [loading, setLoading]       = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError]           = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getSimulateurConteneurs(clientCode, acquit.numeroAcquit)
      .then(data => {
        setConteneurs(data);
        setSelected(new Set(data.map(c => c.numeroConteneur)));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [clientCode, acquit.numeroAcquit]);

  const toggle = (num: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === conteneurs.length ? new Set() : new Set(conteneurs.map(c => c.numeroConteneur))
    );

  const handleSimuler = async () => {
    if (selected.size === 0) return;
    setSimLoading(true);
    onSimuler([...selected], dateSortie);
  };

  const is40 = (c: ConteneurSimuInfo) =>
    c.tailleConteneur?.startsWith('40') ||
    c.typeConteneur?.toUpperCase().includes('FRIGO') ||
    c.typeConteneur?.toUpperCase().includes('REEFER');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
    </div>
  );
  if (error) return <ErrorBanner />;

  const allChecked  = selected.size === conteneurs.length && conteneurs.length > 0;
  const someChecked = selected.size > 0 && selected.size < conteneurs.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>
          <ArrowLeft size={13} /> Retour
        </button>
        <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 14, color: 'var(--gray-800)', padding: '4px 12px', background: 'var(--oncf-orange-bg)', borderRadius: 20, border: '1px solid var(--oncf-orange-border)' }}>
          Acquit {acquit.numeroAcquit}
        </span>
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{conteneurs.length} conteneur{conteneurs.length > 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', width: 40 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>N° Conteneur</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Type</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Connaissement</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Site</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date entrée</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Jours</th>
            </tr>
          </thead>
          <tbody>
            {conteneurs.map(c => {
              const checked = selected.has(c.numeroConteneur);
              return (
                <tr
                  key={c.numeroConteneur}
                  onClick={() => toggle(c.numeroConteneur)}
                  style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: checked ? 'var(--oncf-orange-bg)' : 'white', transition: 'background 0.1s' }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(c.numeroConteneur)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>
                    {c.numeroConteneur}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                      background: is40(c) ? '#eff6ff' : '#f0fdf4',
                      color: is40(c) ? '#2563eb' : '#16a34a' }}>
                      {c.tailleConteneur || '—'} · {c.typeConteneur || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace,monospace', fontSize: 11, color: 'var(--gray-500)' }}>
                    {c.numeroConnaissement || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-600)' }}>{c.siteLibelle || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-600)' }}>{fmtDate(c.dateEntree)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--gray-800)' }}>{c.nombreJours}j</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', padding: '14px 18px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date de sortie estimée</span>
          <input
            type="date"
            value={dateSortie}
            onChange={e => setDateSortie(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--gray-200)', borderRadius: 7, outline: 'none' }}
          />
        </label>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', paddingBottom: 8 }}>
          <strong style={{ color: 'var(--gray-900)' }}>{selected.size}</strong> conteneur{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
        </div>
        <button
          onClick={handleSimuler}
          disabled={selected.size === 0 || simLoading}
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 24px', border: 'none', borderRadius: 8,
            background: selected.size === 0 ? 'var(--gray-200)' : 'var(--primary)',
            color: selected.size === 0 ? 'var(--gray-400)' : 'white',
            fontSize: 13, fontWeight: 700, cursor: selected.size === 0 ? 'default' : 'pointer',
          }}
        >
          {simLoading
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Calculator size={14} />}
          Simuler la facture
        </button>
      </div>
    </div>
  );
}
