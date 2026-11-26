import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Last updated: November 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">1. Eligibility</h2>
            <p className="mt-2">
              Helo is an adults-only (18+) service. By creating an account you confirm you are at
              least 18 years old. Accounts found belonging to users under 18 are removed
              immediately. Date of birth is collected at signup for age verification in line with
              applicable digital protection rules, including the India DPDP Act.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">2. Acceptable use</h2>
            <p className="mt-2">You agree NOT to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Share nudity, sexual content, or conduct sexual harassment.</li>
              <li>Harass, threaten, defame, or promote hate speech against any person or group.</li>
              <li>Spam, advertise, phish, or solicit other users.</li>
              <li>Impersonate another person or misrepresent your age or identity.</li>
              <li>Record other participants without their explicit consent.</li>
              <li>Use the service from jurisdictions where it is unlawful.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">3. Reporting and enforcement</h2>
            <p className="mt-2">
              Every chat session includes a report button. Reports are reviewed by our moderation
              team. Violating these terms can result in warnings, temporary suspensions, or a
              permanent ban. Illegal activity may be referred to the relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">4. Account termination</h2>
            <p className="mt-2">
              You may delete your account at any time from{' '}
              <Link to="/settings" className="text-blue-700 dark:text-blue-400 underline">
                Settings
              </Link>
              . Your profile, stories, and matching preferences are removed along with the account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">5. Service availability</h2>
            <p className="mt-2">
              Helo is provided on an &quot;as is&quot; basis. We do not guarantee uninterrupted
              matching, translation accuracy, or peer-to-peer connection success in all network
              conditions. Features may change or be discontinued.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">6. Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Helo and its operators are not liable for
              indirect or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">7. Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach the team via the{' '}
              <Link to="/faq" className="text-blue-700 dark:text-blue-400 underline">
                FAQ page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
