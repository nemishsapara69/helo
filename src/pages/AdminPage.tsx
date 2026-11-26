import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Shield } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { apiRequest } from '../lib/api';

interface AdminStats {
  active_sessions: number;
  waiting_queue: number;
  open_reports: number;
  resolved_today: number;
  online_users: number;
}

interface AdminReport {
  id: string;
  session_id: string;
  reported_name: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved';
  created_at: string;
}

interface AdminUserRow {
  id: string;
  display_name: string;
  email: string;
  country: string;
  trust_score: number;
  banned: boolean;
  created_at: string;
}

export function AdminPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    apiRequest<{ configured: boolean }>('/api/admin/status')
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(true));
  }, []);

  const loadOverview = useCallback(async (token: string) => {
    setLoadingData(true);
    try {
      const res = await apiRequest<{
        stats: AdminStats;
        reports: AdminReport[];
        users: AdminUserRow[];
      }>('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.stats);
      setReports(res.reports);
      setUsers(res.users);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to load moderation data.');
      setAdminToken(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    try {
      const endpoint = configured ? '/api/admin/login' : '/api/admin/claim';
      const res = await apiRequest<{ adminToken: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      });
      setConfigured(true);
      setAdminToken(res.adminToken);
      setPasscode('');
      await loadOverview(res.adminToken);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBan = async (userId: string) => {
    if (!adminToken) return;
    try {
      const res = await apiRequest<{ user: { id: string; banned: boolean } }>(
        `/api/admin/users/${encodeURIComponent(userId)}/toggle-ban`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === res.user.id ? { ...u, banned: res.user.banned } : u))
      );
    } catch {
      // ignore
    }
  };

  const handleToggleResolve = async (reportId: string) => {
    if (!adminToken) return;
    try {
      const res = await apiRequest<{ report: AdminReport }>(
        `/api/admin/reports/${encodeURIComponent(reportId)}/resolve`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setReports((prev) => prev.map((r) => (r.id === reportId ? res.report : r)));
      await loadOverview(adminToken);
    } catch {
      // ignore
    }
  };

  if (configured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-600 dark:text-neutral-300 text-sm">
        Checking moderation console status…
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-[#0E0A1C] px-4 py-12 transition-colors">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-neutral-950 dark:text-white">
              <LogoMark className="w-7 h-7" />
              <span>Helo Safety</span>
            </Link>
            <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>

          <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
            {configured ? 'Moderation Console Sign In' : 'Claim Admin Access'}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
            {configured
              ? 'Enter the server-configured admin passcode to review active reports and accounts.'
              : 'No admin passcode is configured yet. Choose an admin passcode (6+ characters) to lock this moderation console.'}
          </p>

          {authError && (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {configured ? 'Admin passcode' : 'New admin passcode'}
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                minLength={configured ? 1 : 6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                placeholder="Enter passcode"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Verifying…'
                : configured
                  ? 'Unlock console'
                  : 'Set passcode & unlock'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-white/10 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Return to Helo home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <header className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-neutral-950 dark:text-white">
              <LogoMark className="w-6 h-6" />
              <span>Helo</span>
            </Link>
            <span className="text-neutral-300 dark:text-white/20">/</span>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Safety &amp; Moderation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadOverview(adminToken)}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminToken(null)}
              className="rounded-lg bg-neutral-900 dark:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 dark:hover:bg-blue-700 cursor-pointer"
            >
              Lock console
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Active sessions', value: stats?.active_sessions ?? 0 },
            { label: 'Waiting in queue', value: stats?.waiting_queue ?? 0 },
            { label: 'Open reports', value: stats?.open_reports ?? 0 },
            { label: 'Resolved today', value: stats?.resolved_today ?? 0 },
            { label: 'Connected sockets', value: stats?.online_users ?? 0 },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-5"
            >
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-neutral-950 dark:text-white tabular-nums">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        {/* Reports Table */}
        <section className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
              Safety Reports
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              {reports.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] text-xs text-neutral-500 dark:text-neutral-400">
                  <th className="px-5 py-2.5 font-medium">Partner</th>
                  <th className="px-5 py-2.5 font-medium">Reason</th>
                  <th className="px-5 py-2.5 font-medium">Details</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      No safety reports submitted yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-neutral-50 dark:hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {rep.reported_name}
                      </td>
                      <td className="px-5 py-3 capitalize text-neutral-700 dark:text-neutral-300">
                        {rep.reason}
                      </td>
                      <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                        {rep.details || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold ${
                            rep.status === 'open'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {rep.status === 'open' ? 'Open' : 'Resolved'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(rep.id)}
                          className="rounded-md border border-neutral-200 dark:border-white/15 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                        >
                          {rep.status === 'open' ? 'Mark resolved' : 'Reopen'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Accounts Moderation Table */}
        <section className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
              Registered Accounts
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              {users.length} members
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] text-xs text-neutral-500 dark:text-neutral-400">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Email</th>
                  <th className="px-5 py-2.5 font-medium">Country</th>
                  <th className="px-5 py-2.5 font-medium text-right">Trust</th>
                  <th className="px-5 py-2.5 font-medium">State</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {u.display_name}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{u.country}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                      {u.trust_score}%
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          u.banned ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {u.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleBan(u.id)}
                        className={`rounded-md border px-3 py-1 text-xs font-semibold cursor-pointer ${
                          u.banned
                            ? 'border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/15'
                            : 'border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15'
                        }`}
                      >
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
