import { Link, useLocation } from 'react-router-dom';
import { Building2, Layers, MessageSquare, Users } from 'lucide-react';

export default function AdminSubNav() {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/admin',              label: "Vue d'ensemble", icon: <Layers size={14} />       },
    { to: '/admin/users',        label: 'Utilisateurs',   icon: <Users size={14} />         },
    { to: '/admin/clients',      label: 'Clients',        icon: <Building2 size={14} />     },
    { to: '/admin/reclamations', label: 'Réclamations',   icon: <MessageSquare size={14} /> },
  ];
  return (
    <div className="admin-subnav">
      {tabs.map(t => {
        const active = t.to === '/admin' ? pathname === '/admin' : pathname.startsWith(t.to);
        return (
          <Link key={t.to} to={t.to} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', fontSize: 13, fontWeight: 600,
            color: active ? 'var(--primary)' : 'var(--gray-500)',
            borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
            marginBottom: '-2px', textDecoration: 'none', borderRadius: '4px 4px 0 0',
            background: active ? 'var(--oncf-orange-bg)' : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          }}>
            {t.icon}{t.label}
          </Link>
        );
      })}
    </div>
  );
}
