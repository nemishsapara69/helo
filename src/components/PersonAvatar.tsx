interface PersonAvatarProps {
  name: string;
  src?: string;
  variant?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const PALETTES = [
  { bg: '#DBEAFE', shirt: '#2563EB', hair: '#1E293B', skin: '#E6B89C' },
  { bg: '#E0F2FE', shirt: '#0284C7', hair: '#0F172A', skin: '#C68B59' },
  { bg: '#FEF3C7', shirt: '#D97706', hair: '#451A03', skin: '#F3D2C1' },
  { bg: '#F1F5F9', shirt: '#334155', hair: '#27272A', skin: '#D9A077' },
  { bg: '#EFF6FF', shirt: '#1D4ED8', hair: '#18181B', skin: '#F5D0BA' },
  { bg: '#F3F4F6', shirt: '#1F2937', hair: '#111827', skin: '#8D5524' },
];

const SIZES = {
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

export function PersonAvatar({ name, src, variant, size = 'md' }: PersonAvatarProps) {
  const hash =
    variant !== undefined
      ? variant % PALETTES.length
      : name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PALETTES.length;
  const p = PALETTES[Math.abs(hash)];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${SIZES[size]} rounded-full object-cover object-center shrink-0`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${SIZES[size]} rounded-full shrink-0 overflow-hidden`}
      role="img"
      aria-label={`${name} avatar`}
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="32" fill={p.bg} />

      {/* Body — ellipse sits in lower third, well clear of bottom edge */}
      <ellipse cx="32" cy="60" rx="20" ry="10" fill={p.shirt} />

      {/* Neck */}
      <rect x="27.5" y="46" width="9" height="7" rx="2.5" fill={p.skin} />

      {/* Head — centred at y=36, top of head at y=24, bottom at y=48 */}
      <circle cx="32" cy="36" r="12" fill={p.skin} />

      {/* Hair — cap stops at y=22, well inside the circle (top of circle is y=0) */}
      <path
        d="M20.5 35C20.5 26.5 25.5 21 32 21C38.5 21 43.5 26.5 43.5 35C42 30.5 38 28 32 28C26 28 22 30.5 20.5 35Z"
        fill={p.hair}
      />

      {/* Eyes */}
      <circle cx="28" cy="36" r="1.4" fill="#1E293B" />
      <circle cx="36" cy="36" r="1.4" fill="#1E293B" />

      {/* Smile */}
      <path
        d="M28.5 41C29.8 42.5 34.2 42.5 35.5 41"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
