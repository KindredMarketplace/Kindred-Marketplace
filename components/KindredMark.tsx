/**
 * KindredMark — the Kindred logo SVG (circle + heart + plus).
 *
 * The mock defines this once as an SVG <symbol> and references it with <use>.
 * In React we make it a component. Pass a `size` prop (default 40).
 *
 * The gradient def has a unique id so multiple instances on a page don't clash.
 */

export function KindredMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kindred-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8FC9B5" />
          <stop offset="50%" stopColor="#5BA9B8" />
          <stop offset="100%" stopColor="#7BB3D6" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#kindred-grad)" strokeWidth="1.5" />
      <path
        d="M32 48 C 18 38, 12 28, 18 22 C 22 18, 28 20, 32 25 C 36 20, 42 18, 46 22 C 52 28, 46 38, 32 48 Z"
        fill="none"
        stroke="url(#kindred-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M30 28 H34 V31 H37 V35 H34 V38 H30 V35 H27 V31 H30 Z" fill="url(#kindred-grad)" />
    </svg>
  );
}
