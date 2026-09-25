import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients } from '../api/client';
import type { ClientSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function ClientSelection() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [filtered, setFiltered] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const pageSize = 1000;

  useEffect(() => {
    getClients(1, pageSize)
      .then(data => {
        setClients(data.items);
        setFiltered(data.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltered(clients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        clients.filter(
          c =>
            c.clientCode.toLowerCase().includes(q) ||
            c.nomClient.toLowerCase().includes(q),
        ),
      );
    }
  }, [search, clients]);

  const selectClient = (code: string, nom: string) => {
    impersonate(code, nom);
    navigate('/dashboard');
  };

  return (
    <div className="client-selection">
      <div className="client-selection-card">
        <h1>ONCF Portail Logistique</h1>
        <p className="subtitle">Selectionnez votre code client pour acceder au portail</p>

        <input
          type="text"
          placeholder="Rechercher par code ou nom client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
          autoFocus
        />

        {loading ? (
          <p className="loading">Chargement des clients...</p>
        ) : (
          <div className="client-list">
            {filtered.slice(0, 50).map(c => (
              <button
                key={c.clientCode}
                className="client-item"
                onClick={() => selectClient(c.clientCode, c.nomClient)}
              >
                <div className="client-info">
                  <span className="client-code">{c.clientCode}</span>
                  <span className="client-name">{c.nomClient}</span>
                </div>
                <span className="client-stats">
                  {c.enStock} en stock / {c.totalConteneurs} total
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="no-results">Aucun client trouve</p>
            )}
            {filtered.length > 50 && (
              <p className="more-results">
                {filtered.length - 50} clients supplementaires...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
