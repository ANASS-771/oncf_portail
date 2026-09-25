import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Eye, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

function ImpersonationBanner() {
  const navigate = useNavigate();
  const { isAdmin, clientCode, clientName, clearImpersonation } = useAuth();

  if (!isAdmin || !clientCode) return null;

  const quit = () => {
    clearImpersonation();
    navigate('/admin');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '8px 20px',
      background: '#fff7ed', borderBottom: '2px solid #f97316',
      fontSize: 13, color: '#92400e',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <Eye size={15} />
        Consultation en tant que&nbsp;
        <strong>{clientName || clientCode}</strong>
        <span style={{ fontWeight: 400, color: '#b45309' }}>({clientCode})</span>
      </span>
      <button
        type="button"
        onClick={quit}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: 6,
          border: '1px solid #f97316', background: 'white',
          color: '#ea580c', fontWeight: 600, fontSize: 12, cursor: 'pointer',
        }}
      >
        <X size={13} /> Quitter ce contexte
      </button>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile topbar */}
      <header className="topbar">
        <button
          className="topbar-hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
        <img src="/oncf_logo.png" alt="ONCF" style={{ height: 32 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--oncf-navy)' }}>
          Portail Logistique
        </span>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <ImpersonationBanner />
        <Outlet />
      </main>
    </div>
  );
}
