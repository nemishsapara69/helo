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
      {/* Circular background */}
      <circle cx="32" cy="32" r="32" fill={p.bg} />

      {/* Shirt / body — sits in lower half, stops at y=58 so it doesn't reach the circle edge */}
      <path d="M14 62C14 50 21 44 32 44C43 44 50 50 50 62Z" fill={p.shirt} />

      {/* Head */}
      <circle cx="32" cy="27" r="11" fill={p.skin} />

      {/* Hair */}
      <path
        d="M21 26C21 18 26 13.5 32 13.5C38 13.5 43 18 43 26C41.5 22 38 20 32 20C26 20 22.5 22 21 26Z"
        fill={p.hair}
      />

      {/* Eyes */}
      <circle cx="28.5" cy="27" r="1.3" fill="#1E293B" />
      <circle cx="35.5" cy="27" r="1.3" fill="#1E293B" />

      {/* Smile */}
      <path
        d="M29 32C30.2 33.4 33.8 33.4 35 32"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
