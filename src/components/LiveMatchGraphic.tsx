import { motion } from 'motion/react';
import { Video } from 'lucide-react';

interface ConnectionArcGraphicProps {
  modeId: string;
}

export function ConnectionArcGraphic({ modeId }: ConnectionArcGraphicProps) {
  const leftLabel =
    modeId === 'language_practice'
      ? 'Madrid · ES'
      : modeId === 'deep_talks'
        ? 'Bengaluru'
        : modeId === 'speed_round'
          ? '60s Round'
          : modeId === 'make_a_friend'
            ? 'Bristol · UK'
            : 'Tokyo';

  const rightLabel =
    modeId === 'language_practice'
      ? 'Toronto · EN'
      : modeId === 'deep_talks'
        ? 'Berlin'
        : modeId === 'speed_round'
          ? 'Next Match'
          : modeId === 'make_a_friend'
            ? 'Seoul'
            : 'Cairo';

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/80 dark:bg-[#17151D] p-4 select-none transition-colors">
      <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-3">
        <span>{leftLabel}</span>
        <span className="font-mono text-[11px] text-blue-700 dark:text-blue-400">
          {modeId === 'language_practice'
            ? 'Live translation'
            : modeId === 'speed_round'
              ? 'Timed swap'
              : modeId === 'deep_talks'
                ? 'Guided prompt'
                : modeId === 'make_a_friend'
                  ? 'Mutual connect'
                  : 'WebRTC peer link'}
        </span>
        <span>{rightLabel}</span>
      </div>

      <svg
        viewBox="0 0 360 72"
        className="w-full h-16 overflow-visible"
        role="img"
        aria-label="Animated peer-to-peer connection diagram"
      >
        {/* Left participant node */}
        <circle cx="32" cy="36" r="18" className="fill-blue-50 dark:fill-blue-950/60" stroke="#2563EB" strokeWidth="1.75" />
        <circle cx="32" cy="31" r="5" fill="#2563EB" />
        <path
          d="M22 45C23.5 40.5 27.5 39 32 39C36.5 39 40.5 40.5 42 45"
          stroke="#2563EB"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right participant node */}
        <circle cx="328" cy="36" r="18" className="fill-blue-50 dark:fill-blue-950/60" stroke="#2563EB" strokeWidth="1.75" />
        <circle cx="328" cy="31" r="5" fill="#2563EB" />
        <path
          d="M318 45C319.5 40.5 323.5 39 328 39C332.5 39 336.5 40.5 338 45"
          stroke="#2563EB"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />

        {/* Base guide arc */}
        <path
          d="M58 36 C 125 10, 235 10, 302 36"
          fill="none"
          className="stroke-slate-300 dark:stroke-white/20"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Animated signal pulse traveling across the arc */}
        <motion.path
          key={modeId}
          d="M58 36 C 125 10, 235 10, 302 36"
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.25"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Center audio/translation waveform bars */}
        <g transform="translate(154, 44)">
          {[0, 1, 2, 3, 4].map((bar) => (
            <motion.rect
              key={bar}
              x={bar * 11}
              y={0}
              width="5"
              height="16"
              rx="2.5"
              fill="#2563EB"
              style={{ transformOrigin: 'center bottom' }}
              animate={{
                scaleY: [0.35, 1, 0.45, 0.85, 0.35],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: bar * 0.14,
                ease: 'easeInOut',
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function SearchingSignalGraphic() {
  return (
    <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-blue-500/60"
          initial={{ scale: 0.55, opacity: 0.75 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: ring * 0.9,
            ease: 'easeOut',
          }}
        />
      ))}
      <div className="relative w-12 h-12 rounded-full border border-blue-500/50 bg-blue-600/15 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Video className="w-5 h-5" />
      </div>
    </div>
  );
}

export function VoiceWaveformGraphic() {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5 h-8" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <motion.span
          key={idx}
          className="w-1 h-6 rounded-full bg-blue-500"
          style={{ transformOrigin: 'center' }}
          animate={{
            scaleY: [0.3, 1, 0.4, 0.85, 0.3],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: idx * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
