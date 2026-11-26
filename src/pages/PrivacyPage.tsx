import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Last updated: November 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">1. What we collect</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> display name, email, date of birth (age verification), gender, country, interests, language.</li>
              <li><strong>Optional media:</strong> avatar image, story images you upload.</li>
              <li><strong>Session data:</strong> chat messages are relayed in real time and not stored after delivery.</li>
              <li><strong>Consent logs:</strong> cookie and analytics preferences you choose.</li>
              <li><li className="hidden"></li><strong>Diagnostics:</strong> if you opt in, connection quality metrics are used to improve call reliability.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">2. How we use it</h2>
            <p className="mt-2">
              Your profile powers matchmaking (interests, language, country filter), translation
              defaults, and your public profile page. Your email is only used for account login and
              (with your consent) product updates you can{' '}
              <Link to="/unsubscribe" className="text-blue-700 dark:text-blue-400 underline">unsubscribe</Link>{' '}
              from at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">3. Translation and AI</h2>
            <p className="mt-2">
              When auto-translate is enabled, message text is sent to Google Gemini for translation.
              Text is processed in transit and not retained by Helo beyond the conversation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">4. Your rights (DPDP Act / GDPR)</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Export:</strong> download all your data from Settings.</li>
              <li><strong>Correction:</strong> edit profile fields in Settings.</li>
              <li><strong>Erasure:</strong> permanently delete your account and data from Settings.</li>
              <li><strong>Withdraw consent:</strong> marketing consent can be toggled off anytime.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">5. Cookies</h2>
            <p className="mt-2">
              A single HttpOnly session cookie keeps you logged in. Optional analytics cookies are
              only set with your explicit consent via the cookie banner.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">6. Data security</h2>
            <p className="mt-2">
              Passwords are stored as scrypt salted hashes. Session tokens are signed and expire.
              We never ask for government ID uploads.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">7. Children</h2>
            <p className="mt-2">
              Helo is strictly 18+. We do not knowingly process data of minors and remove such
              accounts on discovery.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
