import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { apiRequest } from '../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No reset token found in this link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md px-4 sm:px-6 py-16">
        <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-8">
          <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
            Choose a strong password of at least 8 characters.
          </p>

          {success && (
            <div className="mt-5 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
              Password updated! Redirecting you to log in…
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!token}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none disabled:opacity-50"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!token}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none disabled:opacity-50"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !token}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Saving…' : 'Set new password'}
              </button>

              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                Remember it now?{' '}
                <Link to="/login" className="text-blue-700 dark:text-blue-400 hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
