import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PersonAvatar } from '../components/PersonAvatar';
import { apiRequest } from '../lib/api';
import { LANGUAGES } from '../shared/constants';

interface PublicProfile {
  slug: string;
  display_name: string;
  country: string;
  age: number;
  bio: string;
  avatar: string;
  interests: string[];
  language: string;
  trust_score: number;
  created_at: string;
}

export function ProfileSlugPage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setNotFound(false);
    apiRequest<{ profile: PublicProfile }>(`/api/users/profile/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (active) setProfile(res.profile);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const langName =
    LANGUAGES.find((l) => l.code === profile?.language)?.name || profile?.language || 'English';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-14">
        {loading ? (
          <div className="h-64 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] animate-pulse" />
        ) : notFound || !profile ? (
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
              Page not found
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              No member profile or page matched “/{slug}”.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Helo home
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <PersonAvatar name={profile.display_name} src={profile.avatar} size="xl" />
                <div>
                  <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                    {profile.display_name}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {profile.country} · Age {profile.age} · Speaks {langName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    Trust score {profile.trust_score}%
                  </p>
                </div>
              </div>
              <Link
                to={`/chat?interests=${encodeURIComponent(profile.interests.join(','))}`}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 text-center whitespace-nowrap"
              >
                Match with similar interests
              </Link>
            </div>

            {profile.bio && (
              <p className="mt-6 pt-6 border-t border-neutral-100 dark:border-white/10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {profile.bio}
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-white/10">
              <h2 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Interests
              </h2>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {profile.interests.length > 0 ? profile.interests.join(' · ') : 'Open to any topic'}
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
