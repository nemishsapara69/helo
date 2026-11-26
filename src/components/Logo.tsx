export function LogoMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path
        d="M9 10.5C9 9.67157 9.67157 9 10.5 9H21.5C22.3284 9 23 9.67157 23 10.5V18.5C23 19.3284 22.3284 20 21.5 20H14.5L10 23.5V20H10.5C9.67157 20 9 19.3284 9 18.5V10.5Z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="13.5" cy="14.5" r="1.25" fill="#FFFFFF" />
      <circle cx="18.5" cy="14.5" r="1.25" fill="#FFFFFF" />
    </svg>
  );
}
