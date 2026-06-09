export function Loader({ label = 'Loading…', size = 28, color = '#1ABC9C' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit',
               fontFamily: 'Inter, sans-serif', fontSize: 14 }}
    >
      <span
        style={{
          width: size, height: size, borderRadius: '50%',
          border: `3px solid ${color}33`, borderTopColor: color,
          display: 'inline-block', animation: 'fg-spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes fg-spin { to { transform: rotate(360deg); } }`}</style>
      {label && <span>{label}</span>}
    </div>
  );
}
export default Loader;
