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
        className={`${SIZES[size]} rounded-full object-cover border border-neutral-200 dark:border-white/15 shrink-0`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${SIZES[size]} rounded-full shrink-0 border border-neutral-200/80 dark:border-white/15`}
      role="img"
      aria-label={`${name} avatar`}
    >
      <rect width="64" height="64" rx="32" fill={p.bg} />
      <path d="M12 64C12 50 20 43 32 43C44 43 52 50 52 64H12Z" fill={p.shirt} />
      <circle cx="32" cy="28" r="12" fill={p.skin} />
      <path
        d="M20 27C20 18.5 25.5 13.5 32.5 13.5C39.5 13.5 44 19 44 27C42.5 22.5 38 20 32 20C26 20 21.5 22.5 20 27Z"
        fill={p.hair}
      />
      <circle cx="28" cy="28" r="1.4" fill="#1E293B" />
      <circle cx="36" cy="28" r="1.4" fill="#1E293B" />
      <path
        d="M28.5 33.5C29.8 35 34.2 35 35.5 33.5"
        stroke="#1E293B"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
