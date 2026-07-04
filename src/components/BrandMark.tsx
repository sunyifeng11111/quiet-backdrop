export function BrandMark({ className = 'brand-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="QuietBackdrop">
      <defs>
        <mask id="quiet-backdrop-cutout">
          <rect width="100" height="100" fill="white" />
          <circle cx="48" cy="47" r="18" fill="black" />
          <path d="M58 58L75 75" stroke="black" strokeWidth="10" strokeLinecap="round" />
        </mask>
      </defs>
      <rect x="14" y="14" width="72" height="72" rx="22" fill="currentColor" mask="url(#quiet-backdrop-cutout)" />
    </svg>
  );
}
