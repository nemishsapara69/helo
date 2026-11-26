import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Settings, Sun, User, X } from 'lucide-react';
import { LogoMark } from './Logo';
import { PersonAvatar } from './PersonAvatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  dark?: boolean;
}

export function Header({ dark }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const { isDark: themeIsDark, toggleTheme } = useTheme();
  const isDark = dark !== undefined ? dark : themeIsDark;
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Chat', to: '/chat' },
    { label: 'Stories', to: '/stories' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Safety', to: '/safety' },
  ];

  useEffect(() => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        isDark
          ? 'bg-[#0E0A1C]/95 border-white/10 text-neutral-100 backdrop-blur-md'
          : 'bg-white/95 border-neutral-200 text-neutral-900 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 py-4">
        {/* Zone 1: Brand wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3 text-2xl font-bold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
        >
          <LogoMark className="w-10 h-10 shrink-0" />
          <span>Helo</span>
        </Link>

        {/* Zone 2: single-line nav links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`text-base font-medium whitespace-nowrap shrink-0 transition-colors hover:underline underline-offset-4 ${
                  isDark
                    ? active
                      ? 'text-white'
                      : 'text-neutral-300 hover:text-white'
                    : active
                      ? 'text-neutral-950'
                      : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Theme toggle + Log in button or User Profile Picture */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Round light/dark mode toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isDark
                ? 'border-white/15 bg-white/5 text-amber-400 hover:bg-white/10'
                : 'border-neutral-200 bg-neutral-100 text-blue-600 hover:bg-neutral-200'
            }`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className={`inline-flex items-center rounded-full p-0.5 ring-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  profileMenuOpen
                    ? 'ring-blue-600'
                    : isDark
                      ? 'ring-white/15 hover:ring-blue-500'
                      : 'ring-neutral-200 hover:ring-blue-600'
                }`}
              >
                <PersonAvatar name={user.display_name} src={user.avatar} size="sm" />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="User profile menu"
                  className={`absolute right-0 mt-2 w-56 rounded-xl border p-1.5 shadow-lg ${
                    isDark
                      ? 'border-white/15 bg-[#17151D] text-neutral-100'
                      : 'border-neutral-200 bg-white text-neutral-900'
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b mb-1 ${
                      isDark ? 'border-white/10' : 'border-neutral-100'
                    }`}
                  >
                    <p className="text-sm font-semibold truncate">{user.display_name}</p>
                    <p
                      className={`text-xs truncate ${
                        isDark ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      /{user.slug}
                    </p>
                  </div>
                  <Link
                    to={`/${user.slug}`}
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isDark ? 'hover:bg-white/10 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Public profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isDark ? 'hover:bg-white/10 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'text-red-400 hover:bg-red-500/15'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`md:hidden inline-flex items-center justify-center rounded-lg p-2 min-w-[44px] min-h-[44px] ${
              isDark ? 'text-neutral-200 hover:bg-white/10' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t px-4 py-4 space-y-2 ${
            isDark
              ? 'bg-[#17151D] border-white/10 text-neutral-100'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <PersonAvatar name={user.display_name} src={user.avatar} size="sm" />
                <span>Settings ({user.display_name})</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
