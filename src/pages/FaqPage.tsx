import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

type FaqCategory = 'Getting Started' | 'Safety & Privacy' | 'Features' | 'Account & Technical';

interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: FaqCategory[] = [
  'Getting Started',
  'Safety & Privacy',
  'Features',
  'Account & Technical',
];

const FAQ_ITEMS: FaqItem[] = [
  // Getting Started (5)
  {
    id: 'gs-1',
    category: 'Getting Started',
    question: 'Do I need to create an account before starting a chat?',
    answer:
      'You can enter the chat studio right away to explore, or create a free account to save up to five interests, sync your preferred language, and build a community trust score.',
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    question: 'Is Helo free to use?',
    answer:
      'Yes. Matching, 1-on-1 video/audio/text calls, all five conversation modes, and real-time message translation are available free of charge.',
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    question: 'How does interest matching work?',
    answer:
      'Select up to five interests from 28 topics. Our matchmaking queue prioritizes pairing you with someone online who shares one or more of those topics and highlights your overlap at the start of the call.',
  },
  {
    id: 'gs-4',
    category: 'Getting Started',
    question: 'Can I use Helo without turning on my camera?',
    answer:
      'Yes. Switch the format toggle in the chat filter bar to Audio or Text anytime before joining the queue, or mute your camera inside an active video call.',
  },
  {
    id: 'gs-5',
    category: 'Getting Started',
    question: 'What is the minimum age requirement?',
    answer:
      'Helo is strictly for adults 18 and older. Every signup calculates real age from date of birth in accordance with India DPDP Act and international adult safety standards.',
  },

  // Safety & Privacy (5)
  {
    id: 'sp-1',
    category: 'Safety & Privacy',
    question: 'Why does Helo use ID-free age verification?',
    answer:
      'We verify 18+ eligibility via date of birth checks and active moderation rather than collecting sensitive passport or government ID scans.',
  },
  {
    id: 'sp-2',
    category: 'Safety & Privacy',
    question: 'Are my video and audio calls recorded?',
    answer:
      'No. Video and audio travel peer-to-peer over encrypted WebRTC channels and are never stored on our servers.',
  },
  {
    id: 'sp-3',
    category: 'Safety & Privacy',
    question: 'What happens when I click Report or Block?',
    answer:
      'Blocking ends the call immediately and prevents future matches with that user. Submitting a report sends the session reference and reason directly to our moderation queue for review.',
  },
  {
    id: 'sp-4',
    category: 'Safety & Privacy',
    question: 'How are trust scores calculated?',
    answer:
      'Every member starts with a baseline trust score that rises when partners leave positive feedback and drops following verified safety reports or negative ratings.',
  },
  {
    id: 'sp-5',
    category: 'Safety & Privacy',
    question: 'Can I download or delete my personal data?',
    answer:
      'Yes. Visit Settings anytime to export a JSON archive of your account and stories or permanently delete your profile.',
  },

  // Features (5)
  {
    id: 'ft-1',
    category: 'Features',
    question: 'How many languages does real-time translation support?',
    answer:
      'Helo supports live text translation across 28+ languages. When enabled, incoming messages from a partner speaking a different language appear translated alongside the original phrasing.',
  },
  {
    id: 'ft-2',
    category: 'Features',
    question: 'What is the difference between the five conversation modes?',
    answer:
      'Just Chat is spontaneous matching; Language Practice pairs across different native languages; Deep Talks surfaces guided icebreakers; Make a Friend adds mutual friend requests; and Speed Round runs a 60-second timer.',
  },
  {
    id: 'ft-3',
    category: 'Features',
    question: 'How do AI icebreakers work?',
    answer:
      'Click the Icebreaker button during a session to generate a fresh, open-ended question tailored to your active mode and shared interests.',
  },
  {
    id: 'ft-4',
    category: 'Features',
    question: 'Can I filter matches by region or gender?',
    answer:
      'Yes. Use the Region and Match dropdowns in the chat toolbar to narrow who you pair with before joining the queue.',
  },
  {
    id: 'ft-5',
    category: 'Features',
    question: 'What happens when the 60-second Speed Round timer hits zero?',
    answer:
      'Both screens smoothly wrap up the round and automatically advance you back into the queue for your next 60-second match.',
  },

  // Account & Technical (5)
  {
    id: 'at-1',
    category: 'Account & Technical',
    question: 'Which browsers work best for WebRTC video?',
    answer:
      'Modern desktop and mobile versions of Chrome, Firefox, Safari, and Edge support peer-to-peer WebRTC calls with zero plugins.',
  },
  {
    id: 'at-2',
    category: 'Account & Technical',
    question: 'Why did my video fail to connect behind a corporate firewall?',
    answer:
      'Strict NAT or corporate firewalls occasionally block peer-to-peer UDP traffic. Helo requests TURN relay credentials before each session and gracefully falls back to text if media ports are blocked.',
  },
  {
    id: 'at-3',
    category: 'Account & Technical',
    question: 'How do I reset a forgotten password?',
    answer:
      'Open the Log in page, select Forgot password, and enter your registered email address to request a reset.',
  },
  {
    id: 'at-4',
    category: 'Account & Technical',
    question: 'How do I unsubscribe from email notifications?',
    answer:
      'You can toggle email notifications off in Settings or visit the Unsubscribe page linked in our site footer.',
  },
  {
    id: 'at-5',
    category: 'Account & Technical',
    question: 'How do I contact technical or safety support?',
    answer:
      'Email support@Helo.com for account or technical help, or safety@Helo.com for urgent moderation inquiries.',
  },
];

export function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'All'>('Getting Started');
  const [openId, setOpenId] = useState<string | null>('gs-1');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = q ? true : activeCategory === 'All' || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300">
            Clear answers on matching, real-time translation, privacy, and technical setup.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 20 questions…"
            aria-label="Search FAQ"
            className="w-full rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#17151D] pl-10 pr-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        {!query.trim() && (
          <div className="mt-6 flex flex-wrap gap-1.5 pb-4 border-b border-neutral-200 dark:border-white/10">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-neutral-900 dark:bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Accordion List */}
        <div className="mt-6 divide-y divide-neutral-200 dark:divide-white/10 border border-neutral-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#17151D]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No questions matched “{query}”. Try another term or email support@Helo.com.
            </div>
          ) : (
            filtered.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div>
                      {query.trim() && (
                        <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400 mb-0.5">
                          {item.category}
                        </p>
                      )}
                      <span className="text-sm sm:text-base font-semibold text-neutral-950 dark:text-white">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="px-5 pb-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300"
                      >
                        {item.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Support CTA */}
        <div className="mt-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#17151D] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              Still have a question?
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Our support team responds within one business day.
            </p>
          </div>
          <a
            href="mailto:support@Helo.com"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Contact support@Helo.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
