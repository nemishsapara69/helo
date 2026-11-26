import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

interface CookieBannerProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const CONSENT_KEY = 'helo_consent_saved';

export function CookieBanner({ forceOpen = false, onClose }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      return;
    }
    // Don't show again if the user already saved preferences this browser
    if (localStorage.getItem(CONSENT_KEY)) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [forceOpen]);

  if (!visible) return null;

  const savePreferences = async (allowAnalytics: boolean) => {
    setSaving(true);
    try {
      await apiRequest('/api/consent-proxy', {
        method: 'POST',
        body: JSON.stringify({
          essential: true,
          analytics: allowAnalytics,
          translation_memory: allowAnalytics,
        }),
      });
    } catch {
      // Allow dismissal even if offline
    } finally {
      localStorage.setItem(CONSENT_KEY, String(allowAnalytics));
      setSaving(false);
      setVisible(false);
      onClose?.();
    }
  };

  return (
    <aside
      aria-label="Cookie and privacy preferences"
      className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#17151D] p-4 shadow-lg text-neutral-900 dark:text-neutral-100"
    >
      <p className="text-sm font-semibold">Privacy &amp; Cookie Notice</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
        Helo uses essential session cookies for authentication and optional diagnostics to keep calls reliable.
      </p>

      <label className="mt-3 flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          checked={analytics}
          onChange={(e) => setAnalytics(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 text-blue-600 focus:ring-blue-600"
        />
        <span>Allow translation quality &amp; call diagnostics</span>
      </label>

      <div className="mt-3.5 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => savePreferences(false)}
          className="rounded-lg border border-neutral-200 dark:border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          Essential only
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => savePreferences(analytics)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Save preferences
        </button>
      </div>
    </aside>
  );
}
