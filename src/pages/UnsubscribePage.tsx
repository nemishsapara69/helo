import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { apiRequest } from '../lib/api';

export function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Too many emails');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/api/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ email, reason }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 sm:px-6 py-16">
        <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-8">
          <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
            Email preferences
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Unsubscribe from Helo product updates and community digests anytime.
          </p>

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 p-4 text-sm text-blue-800 dark:text-blue-200">
                {email} has been unsubscribed from optional emails.
              </div>
              <Link
                to="/"
                className="inline-block rounded-lg bg-neutral-900 dark:bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:hover:bg-blue-700"
              >
                Return home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="unsub-email"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="unsub-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="unsub-reason"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Reason (optional)
                </label>
                <select
                  id="unsub-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                >
                  <option>Too many emails</option>
                  <option>No longer using Helo</option>
                  <option>Prefer checking updates in-app</option>
                  <option>Other</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Updating…' : 'Unsubscribe'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
