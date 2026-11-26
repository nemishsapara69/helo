import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { apiRequest, UserProfile } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES, PREFERRED_SIGNUP_LANGUAGES, SIGNUP_INTERESTS } from '../shared/constants';
import { PersonAvatar } from '../components/PersonAvatar';

type AuthTab = 'login' | 'signup' | 'forgot';

export function LoginPage() {
  const [tab, setTab] = useState<AuthTab>('login');
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // If the user was redirected here from a protected action, go back there after login
  const from = (location.state as { from?: string } | null)?.from || '/chat';

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [displayName, setDisplayName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary'>('non-binary');
  const [country, setCountry] = useState('United States');
  const [interests, setInterests] = useState<string[]>(['Music', 'Travel']);
  const [language, setLanguage] = useState('en');
  const [avatarData, setAvatarData] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item)
        ? prev.filter((x) => x !== item)
        : prev.length < 5
          ? [...prev, item]
          : prev
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError('Avatar image must be under 200 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarData(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest<{ accessToken: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setSession(res.accessToken, res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest<{ accessToken: string; user: UserProfile }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          display_name: displayName,
          email: signupEmail,
          password: signupPassword,
          dob,
          gender,
          country,
          interests,
          language,
          avatar: avatarData,
          age_confirmed: ageConfirmed,
          terms_accepted: termsAccepted,
          marketing_consent: marketingConsent,
        }),
      });
      setSession(res.accessToken, res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-xl px-4 sm:px-6 py-12">
        <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 sm:p-8">
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#0E0A1C] p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
                tab === 'signup'
                  ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-5 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
              {notice}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                  Welcome back
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Sign in to sync your interests, language, and trust score.
                </p>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError(null);
                    }}
                    className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Signing in…' : 'Log in'}
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                  Join Helo
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Adults 18+ only. Date of birth is verified under DPDP Act guidelines without ID uploads.
                </p>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <PersonAvatar name={displayName || 'New User'} src={avatarData} size="lg" />
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="inline-block rounded-lg border border-neutral-300 dark:border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Upload avatar (optional)
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    PNG or JPG up to 200 KB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Display name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    placeholder="Maya Lin"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-dob"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Date of birth (18+)
                  </label>
                  <input
                    id="signup-dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-country"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Country
                </label>
                <select
                  id="signup-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                >
                  {COUNTRIES.filter((c) => c !== 'Anywhere').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="maya@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Password (8+ characters)
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Gender
                  </label>
                  <div className="flex rounded-lg border border-neutral-300 dark:border-white/15 p-0.5 bg-neutral-50 dark:bg-[#0E0A1C]">
                    {(['male', 'female', 'non-binary'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                          gender === g
                            ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-lang"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Preferred language
                  </label>
                  <select
                    id="signup-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    {PREFERRED_SIGNUP_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select up to 5 interests ({interests.length}/5)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SIGNUP_INTERESTS.map((item) => {
                    const selected = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-white/25'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    I confirm that I am at least 18 years old (India DPDP Act &amp; adult safety verification).
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/safety" className="text-blue-700 dark:text-blue-400 underline">
                      Community Safety Guidelines
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms" className="text-blue-700 dark:text-blue-400 underline">
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Send occasional product updates (you can unsubscribe anytime).</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Creating account…' : 'Create account & enter chat'}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                  Reset password
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Enter the email linked to your Helo account to receive reset instructions.
                </p>
              </div>
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Sending…' : 'Send reset email'}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="rounded-lg border border-neutral-300 dark:border-white/15 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
