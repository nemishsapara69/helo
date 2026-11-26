import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

interface FooterProps {
  onOpenConsent?: () => void;
}

export function Footer({ onOpenConsent }: FooterProps) {
  return (
    <footer className="border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#17151D] text-neutral-600 dark:text-neutral-400 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-lg">
              <LogoMark className="w-6 h-6" />
              <span>Helo</span>
            </Link>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-xs">
              1-on-1 random video, audio, and translated text conversations built around shared interests and safety.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/chat" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Start Video Chat
                </Link>
              </li>
              <li>
                <Link to="/stories" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Community Stories
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Trust &amp; Safety</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/safety" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Safety Center
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Privacy &amp; Data Export
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Moderation Console
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Contact &amp; Preferences</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@Helo.com" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  support@Helo.com
                </a>
              </li>
              <li>
                <a href="mailto:safety@Helo.com" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  safety@Helo.com
                </a>
              </li>
              <li>
                <Link to="/unsubscribe" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Email Preferences
                </Link>
              </li>
              {onOpenConsent && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenConsent}
                    className="hover:text-neutral-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Cookie Preferences
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <p>Helo · 18+ Adult Platform · DPDP &amp; RTA Labeled</p>
          <p>Encrypted peer-to-peer WebRTC signaling</p>
        </div>
      </div>
    </footer>
  );
}
