import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PersonAvatar } from '../components/PersonAvatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest, UserProfile } from '../lib/api';
import { CONVERSATION_MODES, COUNTRIES, INTERESTS, LANGUAGES } from '../shared/constants';

export function SettingsPage() {
  const { user, loading, setSession, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary'>('non-binary');
  const [country, setCountry] = useState('United States');
  const [age, setAge] = useState(22);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [defaultMode, setDefaultMode] = useState('just_chat');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name);
    setGender(user.gender);
    setCountry(user.country);
    setAge(user.age);
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    setInterests(user.interests || []);
    setLanguage(user.language || 'en');
    setAutoTranslate(user.auto_translate);
    setDefaultMode(user.default_mode || 'just_chat');
    setEmailNotif(user.notifications?.email ?? true);
    setPushNotif(user.notifications?.push ?? false);
  }, [user]);

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
        setAvatar(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName,
          gender,
          country,
          bio,
          avatar,
          interests,
          language,
          auto_translate: autoTranslate,
          default_mode: defaultMode,
          notifications: { email: emailNotif, push: pushNotif },
        }),
      });
      const refreshRes = await apiRequest<{ accessToken: string; user: UserProfile }>(
        '/api/auth/refresh',
        { method: 'POST' }
      );
      setSession(refreshRes.accessToken, res.user);
      setStatus('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiRequest('/api/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `helo-data-${user?.slug || 'account'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export data.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiRequest('/api/users/me/delete', { method: 'POST' });
      await logout();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12">
        {loading ? (
          <div className="h-64 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] animate-pulse" />
        ) : !user ? (
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-8 text-center">
            <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
              Sign in to manage your settings
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Your profile, saved interests, trust score, and data export controls appear here once signed in.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Log in or create account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Account Settings
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Manage your profile, matching preferences, translation defaults, and privacy.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] px-4 py-2.5 text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Community trust score</p>
                <p className="font-mono text-xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {user.trust_score}%
                </p>
              </div>
            </div>

            {status && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                {status}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Profile Card */}
            <section className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
                  Profile
                </h2>
                <Link
                  to={`/${user.slug}`}
                  className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
                >
                  View public profile (/{user.slug})
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <PersonAvatar name={displayName || user.display_name} src={avatar} size="lg" />
                <div>
                  <label
                    htmlFor="settings-avatar"
                    className="inline-block rounded-lg border border-neutral-300 dark:border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Change avatar
                  </label>
                  <input
                    id="settings-avatar"
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
                    htmlFor="s-name"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Display name
                  </label>
                  <input
                    id="s-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="s-age"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Age <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">(set by date of birth at signup)</span>
                  </label>
                  <input
                    id="s-age"
                    type="number"
                    readOnly
                    value={age}
                    className="w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 px-3.5 py-2 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums cursor-not-allowed"
                  />
                </div>
                <div>
                  <label
                    htmlFor="s-country"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Country
                  </label>
                  <select
                    id="s-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    {COUNTRIES.filter((c) => c !== 'Anywhere').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="s-gender"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id="s-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'non-binary')}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="s-bio"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Short bio
                </label>
                <textarea
                  id="s-bio"
                  rows={2}
                  maxLength={280}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Tell future conversation partners what you enjoy talking about…"
                />
              </div>
            </section>

            {/* Interests & Chat Preferences */}
            <section className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
                Matching &amp; Language
              </h2>

              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Interests ({interests.length}/5)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map((item) => {
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="s-lang"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Preferred language
                  </label>
                  <select
                    id="s-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="s-mode"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Default conversation mode
                  </label>
                  <select
                    id="s-mode"
                    value={defaultMode}
                    onChange={(e) => setDefaultMode(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    {CONVERSATION_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-white/10 text-sm text-neutral-700 dark:text-neutral-300">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => setAutoTranslate(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Auto-translate incoming messages into my preferred language</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Email notifications for friend requests &amp; community highlights</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={(e) => setPushNotif(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Browser notifications when a match connects</span>
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            {/* Data Export & Account Deletion */}
            <section className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
                  Your data &amp; account controls
                </h2>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  Download a portable copy of your profile or permanently delete your account.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-white/15 px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download data</span>
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/30 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                  >
                    Confirm permanent delete
                  </button>
                )}
              </div>
            </section>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
