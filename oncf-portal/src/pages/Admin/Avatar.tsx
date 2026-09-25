export function Avatar({ login, role }: Readonly<{ login: string; role: string }>) {
  const initials = login.slice(0, 2).toUpperCase();
  const bg    = role === 'ADMIN' ? 'var(--oncf-navy)' : role === 'AGENT' ? '#e0e7ff' : 'var(--oncf-orange-bg)';
  const color = role === 'ADMIN' ? 'white'            : role === 'AGENT' ? '#4338ca' : 'var(--primary)';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
    }}>{initials}</div>
  );
}
