import { Ban, Eye, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const SAFETY_FEATURES = [
  {
    icon: UserCheck,
    title: 'Age-gated 18+ access',
    description:
      'Birthdate validation under DPDP Act guidelines keeps the platform strictly for adults without storing government ID scans.',
  },
  {
    icon: Lock,
    title: 'Encrypted peer-to-peer streams',
    description:
      'WebRTC audio and video connect directly between browsers using DTLS-SRTP encryption.',
  },
  {
    icon: ShieldCheck,
    title: 'Dynamic trust scores',
    description:
      'Post-session ratings reward respectful participants and flag accounts showing repeated disruptive behavior.',
  },
  {
    icon: Ban,
    title: 'Instant skip & permanent block',
    description:
      'One tap ends any session and prevents future pairing with that account.',
  },
  {
    icon: Eye,
    title: 'Active moderation console',
    description:
      'Submitted reports enter a prioritized review queue with immediate suspension powers for violations.',
  },
];

const SAFETY_TIPS = [
  'Never share personal financial details, home addresses, or private phone numbers with strangers.',
  'Use a neutral background or blur sensitive documents before turning on your camera.',
  'Start in Text or Audio mode if you prefer to get comfortable before enabling video.',
  'Trust your instincts—click Next or End immediately if a conversation makes you uncomfortable.',
  'Use the Report button whenever someone violates nudity, harassment, spam, or 18+ rules.',
  'Keep your account password unique and never share login details.',
  'Be mindful of cultural differences and practice patience in Language Practice mode.',
  'Review your privacy and data export controls regularly in Settings.',
];

const HOTLINES = [
  { region: 'United States', service: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988' },
  { region: 'United Kingdom', service: 'Samaritans', contact: 'Call 116 123' },
  { region: 'European Union', service: 'EU Emergency & Helpline', contact: 'Call 112 / 116 123' },
  { region: 'India', service: 'Tele-MANAS / Kiran', contact: 'Call 14416 or 1800-599-0019' },
  { region: 'Australia', service: 'Lifeline Australia', contact: 'Call 13 11 14' },
  { region: 'Global', service: 'Find A Helpline Directory', contact: 'findahelpline.com' },
];

export function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-1">
        <section className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-[#17151D]/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
              How we keep you safe
            </h1>
            <p className="mt-2.5 text-base text-neutral-600 dark:text-neutral-300 max-w-2xl">
              Helo combines technical safeguards, community trust ratings, and responsive human moderation to keep 1-on-1 conversations respectful.
            </p>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SAFETY_FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6"
                  >
                    <div className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 flex items-center justify-center text-blue-700 dark:text-blue-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="mt-4 font-display text-lg font-semibold text-neutral-950 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8 Safety Tips + 3-Step Moderation Process */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0E0A1C]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-bold text-neutral-950 dark:text-white mb-5">
                Eight essential safety habits
              </h2>
              <ol className="space-y-3">
                {SAFETY_TIPS.map((tip, idx) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-4 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 pt-0.5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-neutral-950 dark:text-white mb-5">
                  Our moderation process
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      step: '01. Detection',
                      body: 'Users flag harassment, nudity, spam, or underage concerns in two clicks directly from the call bar.',
                    },
                    {
                      step: '02. Review',
                      body: 'Trust-and-safety moderators inspect open reports alongside account history and trust score signals.',
                    },
                    {
                      step: '03. Action',
                      body: 'Confirmed violations result in immediate session termination and account suspension.',
                    },
                  ].map((m) => (
                    <div
                      key={m.step}
                      className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#17151D] p-4"
                    >
                      <p className="font-display text-sm font-semibold text-neutral-950 dark:text-white">
                        {m.step}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6">
                <h3 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
                  Report something directly
                </h3>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                  For urgent safety escalations outside a call, reach our safety desk anytime.
                </p>
                <a
                  href="mailto:safety@Helo.com"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Email safety@Helo.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* For Parents + Emergency Resources */}
        <section className="bg-neutral-50/70 dark:bg-[#17151D]/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6">
              <h2 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                For parents &amp; guardians
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Helo is strictly an <strong className="text-neutral-900 dark:text-white">18+ adults-only</strong> platform. Account registration verifies birthdates under India’s Digital Personal Data Protection (DPDP) Act standards, and our pages carry Restricted To Adults (RTA) metadata labels compatible with standard parental filtering software.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                If you believe a minor has registered an account, email{' '}
                <a href="mailto:safety@Helo.com" className="text-blue-700 dark:text-blue-400 underline">
                  safety@Helo.com
                </a>{' '}
                for immediate removal.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6">
              <h2 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                Emergency &amp; crisis resources
              </h2>
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                If you or someone you speak with is in immediate distress, please reach out to local emergency services or a confidential helpline:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-4 font-medium">Region</th>
                      <th className="py-2 pr-4 font-medium">Service</th>
                      <th className="py-2 font-medium">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
                    {HOTLINES.map((h) => (
                      <tr key={h.region}>
                        <td className="py-2.5 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                          {h.region}
                        </td>
                        <td className="py-2.5 pr-4 text-neutral-600 dark:text-neutral-300">
                          {h.service}
                        </td>
                        <td className="py-2.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                          {h.contact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
