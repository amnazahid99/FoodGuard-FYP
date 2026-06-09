import { Inbox } from 'lucide-react';

export function EmptyState({ title = 'Nothing here yet', message = '', icon: Icon = Inbox, action = null }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '32px 20px',
      gap: 10, color: 'inherit', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(26,188,156,0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 22, height: 22, color: '#1ABC9C' }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
      {message && <p style={{ fontSize: 13, opacity: 0.8, maxWidth: 360 }}>{message}</p>}
      {action}
    </div>
  );
}
export default EmptyState;
