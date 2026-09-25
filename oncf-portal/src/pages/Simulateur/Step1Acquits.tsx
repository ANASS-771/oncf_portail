import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { getSimulateurAcquits } from '../../api/client';
import type { AcquitInfo } from '../../types';
import { PAGE_SIZE_XS as PAGE_SIZE } from '../../constants';
import ErrorBanner from '../../components/ui/ErrorBanner';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

export function Step1Acquits({
  clientCode,
  onSelect,
}: Readonly<{
  clientCode: string;
  onSelect: (a: AcquitInfo) => void;
}>) {
  const [acquits, setAcquits] = useState<AcquitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getSimulateurAcquits(clientCode)
      .then(setAcquits)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [clientCode]);

  useEffect(() => { setPage(1); }, [search]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
    </div>
  );
  if (error) return <ErrorBanner />;
  if (acquits.length === 0) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10 }}>
      Aucun acquit avec des conteneurs en stock pour ce client.
    </div>
  );

  const q = search.trim().toLowerCase();
  const filtered = acquits
    .filter(a =>
      !q ||
      a.numeroAcquit.toLowerCase().includes(q) ||
      (a.numeroConnaissement?.toLowerCase().includes(q) ?? false)
    )
    .sort((a, b) => {
      if (q && a.numeroConnaissement && b.numeroConnaissement) {
        const blMatch = (x: AcquitInfo) => x.numeroConnaissement?.toLowerCase().includes(q) ?? false;
        const aByBl = blMatch(a), bByBl = blMatch(b);
        if (aByBl && bByBl) return a.numeroConnaissement.localeCompare(b.numeroConnaissement);
      }
      return 0;
    });

  const nbBls = new Set(filtered.map(a => a.numeroConnaissement).filter(Boolean)).size;
  const blSearchActive = q !== '' && filtered.some(a => a.numeroConnaissement?.toLowerCase().includes(q));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Rechercher par acquit ou N° BL (connaissement)…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', fontSize: 13, border: '1px solid var(--gray-200)', borderRadius: 8, outline: 'none', background: 'white' }}
        />
      </div>

      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{filtered.length} acquit{filtered.length > 1 ? 's' : ''} — cliquez pour sélectionner</span>
        {blSearchActive && nbBls > 0 && (
          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600 }}>
            {nbBls} BL{nbBls > 1 ? 's' : ''} correspondant{nbBls > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {paginated.map((a, idx) => {
          const prevBl = idx > 0 ? paginated[idx - 1].numeroConnaissement : null;
          const isSameBl = blSearchActive && a.numeroConnaissement && a.numeroConnaissement === prevBl;
          const blHighlight = blSearchActive && a.numeroConnaissement?.toLowerCase().includes(q);
          return (
            <div
              key={a.numeroAcquit}
              onClick={() => onSelect(a)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', background: 'white',
                border: '1px solid var(--gray-200)', borderRadius: 10,
                cursor: 'pointer', transition: 'box-shadow 0.1s, border-color 0.1s',
                borderLeft: isSameBl ? '3px solid #93c5fd' : undefined,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--oncf-orange-bg)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--gray-200)';
                el.style.borderLeftColor = isSameBl ? '#93c5fd' : 'var(--gray-200)';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800, fontSize: 15, color: 'var(--gray-900)' }}>
                  {a.numeroAcquit}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3 }}>
                  {a.numeroConnaissement && (
                    <span style={{
                      fontSize: 11, fontFamily: 'ui-monospace,monospace',
                      color: blHighlight ? '#1d4ed8' : 'var(--gray-500)',
                      background: blHighlight ? '#dbeafe' : 'transparent',
                      padding: blHighlight ? '1px 5px' : undefined,
                      borderRadius: blHighlight ? 4 : undefined,
                      fontWeight: blHighlight ? 700 : undefined,
                    }}>
                      BL : {a.numeroConnaissement}
                    </span>
                  )}
                  {a.premierEntree && (
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      Premier entrée : {fmtDate(a.premierEntree)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--oncf-orange-bg)', color: 'var(--primary)' }}>
                {a.nbConteneurs} conteneur{a.nbConteneurs > 1 ? 's' : ''}
              </div>
              <ChevronRight size={16} color="var(--gray-400)" />
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{ minWidth: 32, padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, fontSize: 12, fontWeight: p === page ? 800 : 500, background: p === page ? 'var(--primary)' : 'white', color: p === page ? 'white' : 'var(--gray-700)', cursor: 'pointer' }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, background: 'white', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
