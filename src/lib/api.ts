export interface UserProfile {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  dob: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  country: string;
  bio: string;
  avatar: string;
  interests: string[];
  language: string;
  auto_translate: boolean;
  default_mode: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  marketing_consent: boolean;
  trust_score: number;
  created_at: string;
}

export interface StoryItem {
  id: string;
  author_name: string;
  author_handle: string;
  category: string;
  title: string;
  caption: string;
  media_url: string;
  privacy: 'public' | 'community';
  created_at: string;
  location: string;
}

let inMemoryAccessToken: string | null = null;
let inMemoryUser: UserProfile | null = null;
let refreshPromise: Promise<void> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getStoredUser(): UserProfile | null {
  return inMemoryUser;
}

export function saveSession(accessToken: string, user: UserProfile): void {
  inMemoryAccessToken = accessToken;
  inMemoryUser = user;
}

export function clearSession(): void {
  inMemoryAccessToken = null;
  inMemoryUser = null;
}

/** Silently refresh the access token using the HttpOnly refresh cookie. */
async function silentRefresh(): Promise<void> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        const data = (await res.json()) as { accessToken: string; user: UserProfile };
        inMemoryAccessToken = data.accessToken;
        inMemoryUser = data.user;
      } else {
        // Refresh token also expired — clear everything
        inMemoryAccessToken = null;
        inMemoryUser = null;
      }
    } catch {
      inMemoryAccessToken = null;
      inMemoryUser = null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const makeHeaders = (token: string | null) => {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  const url = path.startsWith('/api') ? path : `/api${path}`;

  let res = await fetch(url, {
    ...options,
    headers: makeHeaders(inMemoryAccessToken),
    credentials: 'include',
  });

  // On 401, try a silent token refresh once then retry the original request
  if (res.status === 401 && !options.headers?.toString().includes('refresh')) {
    await silentRefresh();
    res = await fetch(url, {
      ...options,
      headers: makeHeaders(inMemoryAccessToken),
      credentials: 'include',
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchInterests(): Promise<string[]> {
  const data = await apiRequest<{ interests: string[] }>('/api/interests');
  return data.interests;
}

export async function fetchLanguages() {
  const data = await apiRequest<{
    languages: Array<{ code: string; name: string; nativeName: string }>;
  }>('/api/languages');
  return data.languages;
}

export async function fetchTurnCredentials() {
  return apiRequest<{
    iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  }>('/api/turn-credentials');
}
