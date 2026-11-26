import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Globe2,
  Languages,
  Lock,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserCheck,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PersonAvatar } from '../components/PersonAvatar';
import { MediaImage } from '../components/MediaImage';
import { ConnectionArcGraphic } from '../components/LiveMatchGraphic';
import { CONVERSATION_MODES, INTERESTS, LANGUAGES } from '../shared/constants';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const COMMUNITY_PEOPLE = [
  {
    name: 'Sofia',
    fullName: 'Sofia Morales',
    slug: 'sofia-morales',
    country: 'Spain',
    language: 'Spanish',
    mode: 'Language Practice',
    interests: ['Design', 'Travel', 'Coffee'],
    variant: 0,
  },
  {
    name: 'Arjun',
    fullName: 'Arjun Nair',
    slug: 'arjun-nair',
    country: 'India',
    language: 'Hindi',
    mode: 'Deep Talks',
    interests: ['Tech', 'Astronomy', 'Music'],
    variant: 1,
  },
  {
    name: 'Emma',
    fullName: 'Emma Wright',
    slug: 'emma-wright',
    country: 'United Kingdom',
    language: 'English',
    mode: 'Make a Friend',
    interests: ['Music', 'Books', 'Cinema'],
    variant: 2,
  },
  {
    name: 'Lucas',
    fullName: 'Lucas Weber',
    slug: 'lucas-weber',
    country: 'Germany',
    language: 'German',
    mode: 'Language Practice',
    interests: ['Cycling', 'History', 'Podcasts'],
    variant: 3,
  },
  {
    name: 'Yuki',
    fullName: 'Yuki Tanaka',
    slug: 'yuki-tanaka',
    country: 'Japan',
    language: 'Japanese',
    mode: 'Just Chat',
    interests: ['Photography', 'Cooking', 'Anime'],
    variant: 4,
  },
  {
    name: 'Omar',
    fullName: 'Omar Hassan',
    slug: 'omar-hassan',
    country: 'Egypt',
    language: 'Arabic',
    mode: 'Speed Round',
    interests: ['Design', 'Startups', 'Chess'],
    variant: 5,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I avoided speaking Spanish out loud for two years. Pairing on Language Practice with live inline translation got me speaking daily within three weeks.',
    name: 'Lucas Weber',
    meta: 'Product Engineer · Berlin',
  },
  {
    quote:
      'Filtering by Music and Acoustic Guitar introduced me to a session player in Mumbai. We wrote a full bridge together over a 25-minute call.',
    name: 'Emma Wright',
    meta: 'Songwriter · Bristol',
  },
  {
    quote:
      'The 60-second Speed Round removes awkward small talk. You share one genuine thought, laugh, and move cleanly to the next conversation.',
    name: 'Omar Hassan',
    meta: 'UX Designer · Cairo',
  },
  {
    quote:
      'Being able to verify age without uploading a passport made me comfortable signing up, and the instant block and report tools feel dependable.',
    name: 'Sofia Morales',
    meta: 'Visual Designer · Madrid',
  },
  {
    quote:
      'Deep Talks prompts skip past "where are you from" and jump straight to questions people actually care about answering.',
    name: 'Arjun Nair',
    meta: 'Audio Researcher · Bengaluru',
  },
  {
    quote:
      'I showed a rainy evening walk in Kyoto live on video while learning about winters in Montreal. It felt like stepping out of my bubble.',
    name: 'Yuki Tanaka',
    meta: 'Photographer · Kyoto',
  },
];

const SAFETY_PILLARS = [
  {
    icon: UserCheck,
    title: 'ID-free 18+ verification',
    description:
      'Strict date-of-birth enforcement compliant with DPDP Act guidelines without requiring government document uploads.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust scores & live moderation',
    description:
      'Community ratings and prioritized human review keep bad actors out while rewarding respectful conversations.',
  },
  {
    icon: Lock,
    title: 'Peer-to-peer WebRTC encryption',
    description:
      'Audio and video streams travel directly between participants over encrypted WebRTC channels.',
  },
  {
    icon: SlidersHorizontal,
    title: 'One-tap skip, block & report',
    description:
      'End any call immediately with zero friction, block repeat matches permanently, and flag violations in two clicks.',
  },
];

interface HomePageProps {
  onOpenConsent?: () => void;
}

export function HomePage({ onOpenConsent }: HomePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [selectedMode, setSelectedMode] = useState(CONVERSATION_MODES[0].id);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Music', 'Travel', 'Languages']);
  const [demoText, setDemoText] = useState('Hey! Do you want to practice Spanish or talk about travel?');
  const [demoTargetLang, setDemoTargetLang] = useState('es');
  const [demoTranslation, setDemoTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const activeMode = CONVERSATION_MODES.find((m) => m.id === selectedMode) || CONVERSATION_MODES[0];

  /** Require login before running an action; redirect to /login preserving the next step. */
  const requireLogin = (next: () => void) => {
    if (!user) {
      navigate('/login', { state: { from: '/chat' } });
      return;
    }
    next();
  };

  /** Navigate to the chat studio, or to login first when signed out. */
  const goChat = (query?: string) => {
    const target = query ? `/chat${query}` : '/chat';
    requireLogin(() => navigate(target));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : prev.length < 5
          ? [...prev, interest]
          : prev
    );
  };

  const handleRunTranslationPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoText.trim()) return;
    // Sign in required before using AI translation preview
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await apiRequest<{ translatedText: string; detectedSource: string }>(
        '/api/ai/translate',
        {
          method: 'POST',
          body: JSON.stringify({
            text: demoText,
            target_language: demoTargetLang,
          }),
        }
      );
      setDemoTranslation(res.translatedText);
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Unable to translate right now.');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      {/* Theme Toggle Bar */}
      <div className="sticky top-[57px] z-30 border-b border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-[#17151D]/95 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex items-center justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-white/15 bg-neutral-100 dark:bg-white/5 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Dark mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0E0A1C]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">
                    1-on-1 Video · Audio · Translated Text
                  </p>
                  <h1
                    className="font-display font-bold tracking-tight text-neutral-950 dark:text-white leading-[1.08]"
                    style={{
                      fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
                      textWrap: 'balance',
                    }}
                  >
                    Meet new people, instantly.
                  </h1>
                  <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300 max-w-xl">
                    Have spontaneous 1-on-1 conversations across borders. Match by shared interests,
                    pick from five conversation modes, and speak freely with live message translation
                    in 28+ languages.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => goChat()}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Start chatting</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {user ? (
                      <Link
                        to={`/${user.slug}`}
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                      >
                        View my profile
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                      >
                        Create free account
                      </Link>
                    )}
                  </div>
                </div>

                {/* Trust bar */}
                <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span>ID-free age check</span>
                  <span aria-hidden="true" className="text-neutral-300 dark:text-white/20">
                    ·
                  </span>
                  <span>Live moderation</span>
                  <span aria-hidden="true" className="text-neutral-300 dark:text-white/20">
                    ·
                  </span>
                  <span>Real-time translation</span>
                </div>
              </div>

              {/* Hero Right Visual + Live People Preview */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#17151D] aspect-video lg:flex-1">
                  <MediaImage
                    src="/src/assets/images/hero_video_chat_1795686521049.jpg"
                    alt="Person smiling during a live 1-on-1 Helo video conversation"
                    className="w-full h-full object-cover"
                    fallbackTitle="Helo Live Video Chat"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 text-white">
                    <p className="text-sm font-medium">
                      Matched by shared interests · Encrypted WebRTC video
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {COMMUNITY_PEOPLE.map((person) => (
                    <button
                      key={person.slug}
                      type="button"
                      onClick={() => goChat(`?mode=${encodeURIComponent(person.mode.toLowerCase().replace(/\s+/g, '_'))}`)}
                      className="group flex flex-col items-center rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-2.5 hover:border-blue-600 dark:hover:border-blue-500 transition-colors text-center cursor-pointer"
                    >
                      <PersonAvatar name={person.fullName} variant={person.variant} size="md" />
                      <span className="mt-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-full">
                        {person.name}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-full">
                        {person.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Right Now Community Grid */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-[#17151D]/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  People you can meet on Helo
                </h2>
                <p className="mt-1.5 text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
                  Filter by country, language, and up to five shared interests before matching.
                </p>
              </div>
              <Link
                to="/chat"
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap"
                onClick={(e) => { e.preventDefault(); goChat(); }}
              >
                <span>Open matching studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMMUNITY_PEOPLE.map((person) => (
                <div
                  key={person.slug}
                  className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-5"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <PersonAvatar name={person.fullName} variant={person.variant} size="lg" />
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-neutral-950 dark:text-white truncate">
                        {person.fullName}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {person.country} · {person.language}
                      </p>
                      <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
                        {person.interests.join(' · ')}
                      </p>
                      <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-400">
                        {person.mode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goChat()}
                    className="shrink-0 rounded-lg border border-neutral-200 dark:border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-blue-600 hover:text-blue-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 Conversation Modes Section */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0E0A1C]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="max-w-2xl mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                Five conversation modes for every mood
              </h2>
              <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300">
                Switch modes anytime inside the chat studio—from 60-second speed rounds to guided deep talks.
              </p>
            </div>

            {/* Interactive Segmented Mode Selector */}
            <div
              role="tablist"
              aria-label="Conversation modes"
              className="flex flex-wrap gap-2 pb-6 border-b border-neutral-200 dark:border-white/10"
            >
              {CONVERSATION_MODES.map((mode) => {
                const active = mode.id === selectedMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'text-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="home-mode-pill"
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 rounded-lg bg-neutral-900 dark:bg-blue-600"
                      />
                    )}
                    <span className="relative z-10">{mode.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMode.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Selected Mode
                    </p>
                    <h3 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                      {activeMode.title}
                    </h3>
                    <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {activeMode.description}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {activeMode.detail}
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => goChat(`?mode=${activeMode.id}`)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <span>Try {activeMode.title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <ConnectionArcGraphic modeId={activeMode.id} />
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                {CONVERSATION_MODES.map((mode, idx) => (
                  <motion.button
                    key={mode.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.14 }}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                      mode.id === selectedMode
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/15'
                        : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] hover:border-neutral-300 dark:hover:border-white/25'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 mr-2 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {mode.title}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {mode.id === 'speed_round' ? '60s timer' : 'Instant match'}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Real-Time Translation + Interests Interactive Section */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-[#17151D]/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Live Translation Sandbox */}
              <div className="lg:col-span-7 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-2">
                  <Languages className="w-4 h-4" />
                  <span>Real-time message translation</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                  28+ languages, zero friction
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Toggle auto-translation inside any chat session to read incoming messages in your
                  preferred language while preserving the original text alongside it.
                </p>

                <form onSubmit={handleRunTranslationPreview} className="mt-5 space-y-3">
                  <div>
                    <label
                      htmlFor="demo-msg"
                      className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
                    >
                      Try a message
                    </label>
                    <input
                      id="demo-msg"
                      type="text"
                      value={demoText}
                      onChange={(e) => setDemoText(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label="Target translation language"
                      value={demoTargetLang}
                      onChange={(e) => setDemoTargetLang(e.target.value)}
                      className="rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={translating}
                      className="rounded-lg bg-neutral-900 dark:bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {translating ? 'Translating…' : 'Translate preview'}
                    </button>
                  </div>
                </form>

                {demoTranslation && (
                  <div className="mt-4 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] p-3.5">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Translated output</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {demoTranslation}
                    </p>
                  </div>
                )}
                {translateError && (
                  <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
                    {translateError}
                  </p>
                )}
              </div>

              {/* Right: Interest-based Matching Picker */}
              <div className="lg:col-span-5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-2">
                    <Globe2 className="w-4 h-4" />
                    <span>Interest matching</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                    Pick up to 5 topics
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                    Selected ({selectedInterests.length}/5):{' '}
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {selectedInterests.join(' · ') || 'None'}
                    </span>
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {INTERESTS.slice(0, 18).map((interest) => {
                      const active = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-white/25'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => goChat(`?interests=${encodeURIComponent(selectedInterests.join(','))}`)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <span>Match with these interests</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0E0A1C]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white mb-10">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: '01.',
                  title: 'Click Start & set preferences',
                  text: 'Choose Video, Audio, or Text along with your conversation mode, language, and up to five interests.',
                },
                {
                  num: '02.',
                  title: 'Get matched in seconds',
                  text: 'Our live queue pairs you with someone compatible right now and highlights what you have in common.',
                },
                {
                  num: '03.',
                  title: 'Start talking naturally',
                  text: 'Use AI icebreakers if you want a spark, or toggle instant translation across 28+ languages.',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border border-neutral-200 dark:border-white/10 p-6 bg-white dark:bg-[#17151D]"
                >
                  <p className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    {step.num}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-neutral-950 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials / Real Stories */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-[#17151D]/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Real conversations, real stories
                </h2>
                <p className="mt-1.5 text-base text-neutral-600 dark:text-neutral-300">
                  How people around the world use Helo for language practice, creativity, and friendship.
                </p>
              </div>
              <Link
                to="/stories"
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1.5"
              >
                <span>Browse all stories</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TESTIMONIALS.map((item) => (
                <blockquote
                  key={item.name}
                  className="flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6"
                >
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    “{item.quote}”
                  </p>
                  <footer className="mt-5 pt-4 border-t border-neutral-100 dark:border-white/10">
                    <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.meta}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0E0A1C]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Safety built into every session
                </h2>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300">
                  Clear boundaries, adult-only verification, and instant moderation tools keep conversations welcoming.
                </p>
              </div>
              <Link
                to="/safety"
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1.5"
              >
                <span>Read Safety Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SAFETY_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 flex items-start gap-4"
                  >
                    <div className="rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 p-2.5 text-blue-700 dark:text-blue-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-neutral-950 dark:text-white">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-neutral-950 dark:bg-[#17151D] border-t border-neutral-800 dark:border-white/10 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to say hello?
              </h2>
              <p className="mt-2 text-base text-neutral-300 max-w-xl">
                Jump into a live 1-on-1 video, audio, or translated text chat in seconds—no downloads required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => goChat()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Start for free</span>
            </button>
          </div>
        </section>
      </main>

      <Footer onOpenConsent={onOpenConsent} />
    </div>
  );
}
