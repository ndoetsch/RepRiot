export function Logo({ width = 112 }: { width?: number }) {
  return (
    <svg width={width} height={(width * 96) / 112} viewBox="0 0 112 96" role="img" aria-label="Fitluck logo">
      <rect x="4" y="62" width="20" height="30" rx="6" fill="#7FD1AE" />
      <rect x="30" y="46" width="20" height="46" rx="6" fill="#3DB58A" />
      <rect x="56" y="30" width="20" height="62" rx="6" fill="#15803D" />
      <rect x="82" y="14" width="20" height="78" rx="6" fill="#0F5F2E" />
      <path d="M10 50 L40 32 L66 18 L96 4" stroke="#13293D" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86 3 L97 3.5 L93 13.5" stroke="#13293D" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
