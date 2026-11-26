import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CookieBanner } from './components/CookieBanner';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { StoriesPage } from './pages/StoriesPage';
import { FaqPage } from './pages/FaqPage';
import { SafetyPage } from './pages/SafetyPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { ProfileSlugPage } from './pages/ProfileSlugPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

export default function App() {
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <ThemeProvider>
            <Routes>
              <Route path="/" element={<HomePage onOpenConsent={() => setConsentOpen(true)} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              {/* Public profile — must be last so it doesn't eat the named routes above */}
              <Route path="/:slug" element={<ProfileSlugPage />} />
            </Routes>
            <CookieBanner forceOpen={consentOpen} onClose={() => setConsentOpen(false)} />
          </ThemeProvider>
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}
