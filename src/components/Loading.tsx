export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="screen" role="status">
      <div className="spinner" aria-hidden="true" />
      <p className="center muted small">{label}…</p>
    </div>
  )
}
