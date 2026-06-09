import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '32px 20px',
        gap: 12, color: 'inherit', fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(239,68,68,0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertTriangle style={{ width: 22, height: 22, color: '#ef4444' }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: 13, opacity: 0.8, maxWidth: 360 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, color: '#fff',
            background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)',
          }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} /> Retry
        </button>
      )}
    </div>
  );
}
export default ErrorState;
