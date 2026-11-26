export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface ConversationModeInfo {
  id: 'just_chat' | 'language_practice' | 'deep_talks' | 'make_a_friend' | 'speed_round';
  title: string;
  shortLabel: string;
  description: string;
  detail: string;
}

export const INTERESTS: string[] = [
  'Music',
  'Travel',
  'Photography',
  'Cooking',
  'Gaming',
  'Movies',
  'Books',
  'Fitness',
  'Tech',
  'Art',
  'Languages',
  'Coffee',
  'Nature',
  'Astronomy',
  'Design',
  'Podcasts',
  'Anime',
  'Startups',
  'History',
  'Philosophy',
  'Cycling',
  'Volunteering',
  'Writing',
  'Cinema',
  'Science',
  'Fashion',
  'Gardening',
  'Chess',
];

export const SIGNUP_INTERESTS: string[] = INTERESTS.slice(0, 18);

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Mandarin', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
];

export const PREFERRED_SIGNUP_LANGUAGES: LanguageOption[] = LANGUAGES.slice(0, 18);

export const CONVERSATION_MODES: ConversationModeInfo[] = [
  {
    id: 'just_chat',
    title: 'Just Chat',
    shortLabel: 'Just Chat',
    description: 'Spontaneous 1-on-1 conversations with someone new right now.',
    detail: 'Casual random matching with zero pressure and instant skip.',
  },
  {
    id: 'language_practice',
    title: 'Language Practice',
    shortLabel: 'Language',
    description: 'Pair with native speakers and translate unfamiliar phrases inline.',
    detail: 'Matches across languages with live translation side by side.',
  },
  {
    id: 'deep_talks',
    title: 'Deep Talks',
    shortLabel: 'Deep Talks',
    description: 'Skip small talk with curated conversation starters and thoughtful topics.',
    detail: 'Includes live icebreaker prompts tailored to shared interests.',
  },
  {
    id: 'make_a_friend',
    title: 'Make a Friend',
    shortLabel: 'Friends',
    description: 'Unrushed conversations built for genuine connection and follow-up.',
    detail: 'Longer sessions with optional mutual friend requests at the end.',
  },
  {
    id: 'speed_round',
    title: 'Speed Round',
    shortLabel: 'Speed 60s',
    description: '60-second timed rounds that automatically move you to the next person.',
    detail: 'Fast-paced 60-second timer synced across both screens.',
  },
];

export const COUNTRIES: string[] = [
  'Anywhere',
  'Argentina',
  'Australia',
  'Bangladesh',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Ghana',
  'Greece',
  'Hong Kong',
  'Hungary',
  'India',
  'Indonesia',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Kenya',
  'Malaysia',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Pakistan',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
];

export const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity or sexually explicit content' },
  { id: 'harassment', label: 'Harassment, hate speech, or abuse' },
  { id: 'spam', label: 'Spam, scams, or solicitation' },
  { id: 'underage', label: 'Suspected underage user (under 18)' },
  { id: 'other', label: 'Other safety concern' },
] as const;
