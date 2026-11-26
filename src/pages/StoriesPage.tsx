import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PersonAvatar } from '../components/PersonAvatar';
import { MediaImage } from '../components/MediaImage';
import { apiRequest, StoryItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STORY_CATEGORIES = ['All', 'Friendship', 'Culture', 'Language', 'Travel', 'Music', 'Career'];

export function StoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Story viewer overlay
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Create story modal
  const [createOpen, setCreateOpen] = useState(false);
  const [authorName, setAuthorName] = useState(user?.display_name || '');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Friendship');
  const [location, setLocation] = useState(user?.country || '');
  const [privacy, setPrivacy] = useState<'public' | 'community'>('public');
  const [mediaUrl, setMediaUrl] = useState('/src/assets/images/story_friendship_1795686520171.jpg');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ stories: StoryItem[] }>('/api/stories')
      .then((res) => {
        if (active) setStories(res.stories);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user?.display_name && !authorName) {
      setAuthorName(user.display_name);
    }
  }, [user, authorName]);

  // Auto-advancing story viewer progress bar
  useEffect(() => {
    if (viewerIndex === null || stories.length === 0) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setViewerIndex((curr) => {
            if (curr === null) return null;
            return curr + 1 < stories.length ? curr + 1 : null;
          });
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [viewerIndex, stories.length]);

  const handleMediaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 250 * 1024) {
      setFormError('Image must be under 250 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaUrl(reader.result);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await apiRequest<{ story: StoryItem }>('/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          author_name: authorName || user?.display_name || 'Community Member',
          category,
          title,
          caption,
          media_url: mediaUrl,
          privacy,
          location: location || 'Global',
        }),
      });
      setStories((prev) => [res.story, ...prev]);
      setCreateOpen(false);
      setTitle('');
      setCaption('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish story.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStories =
    categoryFilter === 'All' ? stories : stories.filter((s) => s.category === categoryFilter);

  const activeViewerStory = viewerIndex !== null ? stories[viewerIndex] : null;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-1">
        <section className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-[#17151D]/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Community Stories
                </h1>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300 max-w-2xl">
                  Moments shared by people who met through Helo—from language breakthroughs to late-night acoustic jams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create a story</span>
              </button>
            </div>

            {/* Story Bubbles Bar */}
            <div className="mt-8 flex items-center gap-4 overflow-x-auto pb-2">
              {stories.slice(0, 8).map((story, idx) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setViewerIndex(idx)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                >
                  <div className="flex items-center justify-center rounded-full overflow-hidden ring-2 ring-blue-600 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-[#17151D] group-hover:scale-105 transition-transform">
                    <PersonAvatar name={story.author_name} variant={idx} size="lg" />
                  </div>
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[76px] truncate">
                    {story.author_name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Story Cards */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex flex-wrap items-center gap-1.5 pb-6 border-b border-neutral-200 dark:border-white/10 mb-8">
            {STORY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-neutral-900 dark:bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#17151D] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => {
                const actualIndex = stories.findIndex((s) => s.id === story.id);
                return (
                  <article
                    key={story.id}
                    className="overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => setViewerIndex(actualIndex >= 0 ? actualIndex : 0)}
                      className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-[#0E0A1C] cursor-pointer block"
                    >
                      <MediaImage
                        src={story.media_url}
                        alt={story.title}
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                        fallbackTitle={story.category}
                      />
                    </button>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {story.category} · {story.location}
                        </p>
                        <h2 className="mt-1.5 font-display text-lg font-semibold text-neutral-950 dark:text-white leading-snug">
                          {story.title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {story.caption}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {story.author_name}
                        </span>
                        <span>{story.author_handle}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-950 dark:bg-[#17151D] p-8 sm:p-10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Start your own story</h2>
              <p className="mt-1.5 text-sm text-neutral-300">
                Meet someone new in seconds and see where one conversation leads.
              </p>
            </div>
            <Link
              to="/chat"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Start chatting
            </Link>
          </div>
        </section>
      </main>

      {/* Story Viewer Overlay */}
      {activeViewerStory && viewerIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Story viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-neutral-900 text-white border border-white/15">
            {/* Progress bar */}
            <div className="absolute top-0 inset-x-0 z-20 p-3 flex gap-1">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{
                      width:
                        idx < viewerIndex
                          ? '100%'
                          : idx === viewerIndex
                            ? `${progress}%`
                            : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-6 inset-x-0 z-20 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{activeViewerStory.author_name}</p>
                <p className="text-xs text-neutral-300">
                  {activeViewerStory.category} · {activeViewerStory.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewerIndex(null)}
                aria-label="Close story viewer"
                className="rounded-full bg-black/50 p-1.5 text-white hover:bg-black/75 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[3/4] w-full relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeViewerStory.id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full relative"
                >
                  <MediaImage
                    src={activeViewerStory.media_url}
                    alt={activeViewerStory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-6">
                    <h3 className="font-display text-lg font-bold">{activeViewerStory.title}</h3>
                    <p className="mt-1.5 text-sm text-neutral-200 leading-relaxed">
                      {activeViewerStory.caption}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setViewerIndex((i) => (i !== null && i > 0 ? i - 1 : 0))}
              aria-label="Previous story"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setViewerIndex((i) =>
                  i !== null && i + 1 < stories.length ? i + 1 : null
                )
              }
              aria-label="Next story"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create a story"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#17151D] p-6 text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Share a Helo story</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close modal"
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="story-author"
                    className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Your name
                  </label>
                  <input
                    id="story-author"
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    placeholder="Alex Rivera"
                  />
                </div>
                <div>
                  <label
                    htmlFor="story-location"
                    className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    City / Country
                  </label>
                  <input
                    id="story-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    placeholder="Austin, US"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="story-category"
                    className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="story-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    {STORY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="story-privacy"
                    className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Visibility
                  </label>
                  <select
                    id="story-privacy"
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value as 'public' | 'community')}
                    className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="public">Public feed</option>
                    <option value="community">Signed-in members only</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="story-title"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Story headline
                </label>
                <input
                  id="story-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="How a 10-minute chat turned into a language swap"
                />
              </div>

              <div>
                <label
                  htmlFor="story-caption"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Story details
                </label>
                <textarea
                  id="story-caption"
                  rows={3}
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Tell the community what happened…"
                />
              </div>

              <div>
                <label
                  htmlFor="story-photo"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Upload photo (optional)
                </label>
                <input
                  id="story-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleMediaFile}
                  className="block w-full text-xs text-neutral-600 dark:text-neutral-400 file:mr-3 file:rounded-lg file:border file:border-neutral-300 dark:file:border-white/15 file:bg-neutral-50 dark:file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-800 dark:file:text-neutral-200"
                />
              </div>

              {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-neutral-300 dark:border-white/15 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Publishing…' : 'Publish story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
