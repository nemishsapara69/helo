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
      {/* Full circular background */}
      <circle cx="32" cy="32" r="32" fill={p.bg} />

      {/* Body / shirt — wide trapezoid anchored well inside bottom of circle */}
      <ellipse cx="32" cy="62" rx="22" ry="12" fill={p.shirt} />

      {/* Neck */}
      <rect x="27" y="44" width="10" height="8" rx="3" fill={p.skin} />

      {/* Head — centred at y=34 so there's clear space above */}
      <circle cx="32" cy="34" r="12" fill={p.skin} />

      {/* Hair — cap that stays inside top of head, never touches y<16 */}
      <path
        d="M20 33C20 24 25.5 18 32 18C38.5 18 44 24 44 33C42 28 38 25.5 32 25.5C26 25.5 22 28 20 33Z"
        fill={p.hair}
      />

      {/* Eyes */}
      <circle cx="28" cy="34" r="1.4" fill="#1E293B" />
      <circle cx="36" cy="34" r="1.4" fill="#1E293B" />

      {/* Smile */}
      <path
        d="M28.5 39C29.8 40.5 34.2 40.5 35.5 39"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
