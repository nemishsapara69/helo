import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  CONVERSATION_MODES,
  INTERESTS,
  LANGUAGES,
  REPORT_REASONS,
} from './src/shared/constants.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// JWT signing secret — read from environment with random per-process fallback
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Persistent local store path confined within workspace
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'helo-store.json');

interface UserRecord {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  password_hash: string;
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
  banned: boolean;
  blocked_ids: string[];
  created_at: string;
}

interface StoryRecord {
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

interface ReportRecord {
  id: string;
  session_id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_name: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

interface StoreData {
  users: UserRecord[];
  stories: StoryRecord[];
  reports: ReportRecord[];
  adminCredentialHash: string | null;
  unsubscribedEmails: string[];
  consentLogs: Array<{ id: string; preferences: Record<string, boolean>; timestamp: string }>;
  passwordResetRequests: Array<{ email: string; requested_at: string }>;
  passwordResetTokens: Array<{ token: string; user_id: string; expires_at: string }>;
  friends: FriendRecord[];
}

interface FriendRecord {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const DEFAULT_STORIES: StoryRecord[] = [
  {
    id: 'story-1',
    author_name: 'Sofia Morales',
    author_handle: '@sofiam',
    category: 'Friendship',
    title: 'Two strangers in Madrid & Seoul turned into weekly coffee catchups',
    caption:
      'Matched on Make a Friend while sketching in a rainy afternoon cafe. Six months later we still call every Sunday morning.',
    media_url: '/src/assets/images/story_friendship_1795686520171.jpg',
    privacy: 'public',
    created_at: '2026-11-22T14:30:00Z',
    location: 'Madrid, Spain',
  },
  {
    id: 'story-2',
    author_name: 'Yuki Tanaka',
    author_handle: '@yukit',
    category: 'Culture',
    title: 'Midnight Kyoto walk shared live with someone in Toronto',
    caption:
      'Showed the lantern alleys of Pontocho during an evening walk while learning how winter feels across the ocean.',
    media_url: '/src/assets/images/story_culture_1795686521141.jpg',
    privacy: 'public',
    created_at: '2026-11-23T19:15:00Z',
    location: 'Kyoto, Japan',
  },
  {
    id: 'story-3',
    author_name: 'Lucas Weber',
    author_handle: '@lucasw',
    category: 'Language',
    title: 'Cleared my B2 Spanish conversation anxiety in three weeks',
    caption:
      'Using Language Practice mode with inline translation meant I never froze when I forgot a verb.',
    media_url: '/src/assets/images/story_language_1795686520129.jpg',
    privacy: 'public',
    created_at: '2026-11-24T09:45:00Z',
    location: 'Berlin, Germany',
  },
  {
    id: 'story-4',
    author_name: 'Emma Wright',
    author_handle: '@emmaw',
    category: 'Music',
    title: 'Swapping acoustic chord progressions across time zones',
    caption:
      'Filtered by Music and Indie, met a session bassist in Mumbai, and co-wrote a chorus in 25 minutes.',
    media_url: '/src/assets/images/story_music_1795686520469.jpg',
    privacy: 'public',
    created_at: '2026-11-25T16:10:00Z',
    location: 'Bristol, UK',
  },
  {
    id: 'story-5',
    author_name: 'Arjun Nair',
    author_handle: '@arjunn',
    category: 'Travel',
    title: 'Getting local street food recs before landing in Lisbon',
    caption:
      'Set my country filter to Portugal on Deep Talks and got a hand-typed list of neighborhood bakeries.',
    media_url: '/src/assets/images/hero_video_chat_1795686521049.jpg',
    privacy: 'public',
    created_at: '2026-11-25T20:05:00Z',
    location: 'Bengaluru, India',
  },
  {
    id: 'story-6',
    author_name: 'Omar Hassan',
    author_handle: '@omarh',
    category: 'Career',
    title: 'Mock product design critiques with peers around the globe',
    caption:
      'Speed Round gave me crisp 60-second portfolio feedback from designers I would never have crossed paths with.',
    media_url: '/src/assets/images/story_language_1795686520129.jpg',
    privacy: 'public',
    created_at: '2026-11-26T00:10:00Z',
    location: 'Cairo, Egypt',
  },
];

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as StoreData;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        stories: Array.isArray(parsed.stories) && parsed.stories.length > 0 ? parsed.stories : DEFAULT_STORIES,
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        adminCredentialHash: parsed.adminCredentialHash ?? null,
        unsubscribedEmails: Array.isArray(parsed.unsubscribedEmails) ? parsed.unsubscribedEmails : [],
        consentLogs: Array.isArray(parsed.consentLogs) ? parsed.consentLogs : [],
        passwordResetRequests: Array.isArray(parsed.passwordResetRequests) ? parsed.passwordResetRequests : [],
        passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
        friends: Array.isArray(parsed.friends) ? parsed.friends : [],
      };
    }
  } catch (err) {
    console.error('Failed to read store, initializing fresh store:', err);
  }

  const initial: StoreData = {
    users: [
      {
        id: 'user-sofia',
        slug: 'sofia-morales',
        display_name: 'Sofia Morales',
        email: 'sofia@example.com',
        password_hash: hashPassword(crypto.randomBytes(24).toString('hex')),
        dob: '1999-05-14',
        age: 27,
        gender: 'female',
        country: 'Spain',
        bio: 'Visual designer learning Japanese and collecting espresso recipes.',
        avatar: '',
        interests: ['Design', 'Travel', 'Coffee', 'Languages'],
        language: 'es',
        auto_translate: true,
        default_mode: 'language_practice',
        notifications: { email: true, push: false },
        marketing_consent: false,
        trust_score: 98,
        banned: false,
        blocked_ids: [],
        created_at: '2026-10-12T10:00:00Z',
      },
      {
        id: 'user-arjun',
        slug: 'arjun-nair',
        display_name: 'Arjun Nair',
        email: 'arjun@example.com',
        password_hash: hashPassword(crypto.randomBytes(24).toString('hex')),
        dob: '1997-08-21',
        age: 29,
        gender: 'male',
        country: 'India',
        bio: 'Audio tinkerer, astronomy nerd, always up for deep talks.',
        avatar: '',
        interests: ['Tech', 'Astronomy', 'Music', 'Philosophy'],
        language: 'hi',
        auto_translate: true,
        default_mode: 'deep_talks',
        notifications: { email: true, push: true },
        marketing_consent: false,
        trust_score: 96,
        banned: false,
        blocked_ids: [],
        created_at: '2026-10-18T11:20:00Z',
      },
    ],
    stories: DEFAULT_STORIES,
    reports: [
      {
        id: 'rep-101',
        session_id: 'sess-demo-881',
        reporter_id: 'user-sofia',
        reported_user_id: 'user-arjun',
        reported_name: 'Guest #4821',
        reason: 'spam',
        details: 'Repeated promotional links dropped in chat sidebar.',
        status: 'resolved',
        created_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      },
    ],
    adminCredentialHash: null,
    unsubscribedEmails: [],
    consentLogs: [],
    passwordResetRequests: [],
    passwordResetTokens: [],
    friends: [],
  };
  saveStore(initial);
  return initial;
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

let store = loadStore();

// JWT helper using built-in crypto HMAC-SHA256
interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh' | 'admin';
  exp: number;
}

function signToken(payload: Omit<TokenPayload, 'exp'>, ttlSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string, expectedType: TokenPayload['type']): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;
    if (decoded.type !== expectedType) return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function calculateAge(dobString: string): number | null {
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return age;
}

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    slug: user.slug,
    display_name: user.display_name,
    email: user.email,
    dob: user.dob,
    age: user.age,
    gender: user.gender,
    country: user.country,
    bio: user.bio,
    avatar: user.avatar,
    interests: user.interests,
    language: user.language,
    auto_translate: user.auto_translate,
    default_mode: user.default_mode,
    notifications: user.notifications,
    marketing_consent: user.marketing_consent,
    trust_score: user.trust_score,
    created_at: user.created_at,
  };
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    result[k] = decodeURIComponent(v);
  }
  return result;
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  const maxAge = 7 * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `helo_refresh=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None; Partitioned`
  );
}

function clearRefreshCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    'helo_refresh=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned'
  );
}

function isSameOriginOrXhr(req: Request): boolean {
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') return true;
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  if (!origin || !host) return false;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === host;
  } catch {
    return false;
  }
}

interface AuthedRequest extends Request {
  user?: UserRecord;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token, 'access');
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid.' });
    return;
  }
  const user = store.users.find((u) => u.id === payload.sub);
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: 'This account has been suspended for safety violations.' });
    return;
  }
  req.user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token, 'admin');
  if (!payload || payload.sub !== 'admin') {
    res.status(401).json({ error: 'Admin session expired or invalid.' });
    return;
  }
  next();
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'member';
  let candidate = base;
  let counter = 1;
  while (store.users.some((u) => u.slug === candidate)) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
}

function isSafeMediaUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/src/assets/')) return true;
  if (url.startsWith('data:image/')) return url.length < 300_000;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function translateTextWithGemini(
  text: string,
  targetLanguageCode: string,
  sourceLanguageCode?: string
): Promise<{ translatedText: string; detectedSource: string }> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  const targetLang = LANGUAGES.find((l) => l.code === targetLanguageCode)?.name || targetLanguageCode;
  const sourceHint = sourceLanguageCode
    ? LANGUAGES.find((l) => l.code === sourceLanguageCode)?.name || sourceLanguageCode
    : 'auto-detect';

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Translate the following conversational message into ${targetLang} (source hint: ${sourceHint}). Preserve natural tone, idioms, and brevity.\n\nMessage:\n${text}`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: {
            type: Type.STRING,
            description: 'The natural translation in the target language.',
          },
          detectedSource: {
            type: Type.STRING,
            description: 'The detected source language name.',
          },
        },
        required: ['translatedText', 'detectedSource'],
      },
    },
  });

  const raw = (response.text ?? '{}').trim();
  const parsed = JSON.parse(raw) as { translatedText?: string; detectedSource?: string };
  if (!parsed.translatedText) {
    throw new Error('Translation returned empty content.');
  }
  return {
    translatedText: parsed.translatedText,
    detectedSource: parsed.detectedSource || sourceHint,
  };
}

async function generateIcebreakerWithGemini(
  mode: string,
  sharedInterests: string[]
): Promise<string> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  const modeLabel = CONVERSATION_MODES.find((m) => m.id === mode)?.title || 'Just Chat';
  const interestPrompt =
    sharedInterests.length > 0
      ? `Shared interests between both people: ${sharedInterests.join(', ')}.`
      : 'They have not listed overlapping interests yet.';

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Generate one warm, natural, open-ended 1-sentence conversation starter for two adults meeting on a 1-on-1 video/text chat app in "${modeLabel}" mode. ${interestPrompt} Avoid cliches and keep it under 22 words.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = (response.text ?? '').trim().replace(/^["']|["']$/g, '');
  if (!text) {
    throw new Error('Failed to generate icebreaker.');
  }
  return text;
}

/** Minimal SMTP email sender using Node's built-in net/tls — no npm packages needed. */
async function sendResetEmail(to: string, name: string, resetLink: string): Promise<void> {
  const { createTransport } = await import('nodemailer' as never as string).catch(() => {
    throw new Error('nodemailer not available');
  }) as { createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } };

  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Helo <no-reply@helo.example.com>',
    to,
    subject: 'Reset your Helo password',
    text: `Hi ${name},\n\nClick the link below to reset your password. It expires in 1 hour.\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nThe Helo Team`,
    html: `<p>Hi ${name},</p><p>Click the button below to reset your Helo password. This link expires in <strong>1 hour</strong>.</p><p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: false },
  });

  // ---- Reference endpoints ----
  app.get('/api/interests', (_req, res) => {
    res.json({ interests: INTERESTS });
  });

  app.get('/api/languages', (_req, res) => {
    res.json({ languages: LANGUAGES });
  });

  app.get('/api/turn-credentials', (_req, res) => {
    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      });
    }
    res.json({ iceServers });
  });

  // ---- Auth endpoints ----
  app.post('/api/auth/signup', (req, res) => {
    const {
      display_name,
      email,
      password,
      dob,
      gender,
      country: signupCountry,
      interests,
      language,
      avatar,
      marketing_consent,
      age_confirmed,
      terms_accepted,
    } = req.body ?? {};

    if (typeof display_name !== 'string' || display_name.trim().length < 2 || display_name.trim().length > 40) {
      res.status(400).json({ error: 'Display name must be between 2 and 40 characters.' });
      return;
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (typeof dob !== 'string') {
      res.status(400).json({ error: 'Date of birth is required for age verification.' });
      return;
    }
    const age = calculateAge(dob);
    if (age === null || age < 18 || age > 120) {
      res.status(400).json({
        error: 'You must be at least 18 years old to join Helo (DPDP Act compliance).',
      });
      return;
    }
    if (!age_confirmed || !terms_accepted) {
      res.status(400).json({ error: 'You must confirm you are 18+ and accept the Terms & Safety Policy.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (store.users.some((u) => u.email === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const validGender: UserRecord['gender'] =
      gender === 'male' || gender === 'female' || gender === 'non-binary' ? gender : 'non-binary';
    const validInterests = Array.isArray(interests)
      ? interests.filter((i): i is string => typeof i === 'string' && INTERESTS.includes(i)).slice(0, 5)
      : [];
    const validLanguage =
      typeof language === 'string' && LANGUAGES.some((l) => l.code === language) ? language : 'en';
    const safeAvatar = typeof avatar === 'string' && isSafeMediaUrl(avatar) ? avatar : '';

    const newUser: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      slug: slugify(display_name.trim()),
      display_name: display_name.trim(),
      email: normalizedEmail,
      password_hash: hashPassword(password),
      dob,
      age,
      gender: validGender,
      country: typeof signupCountry === 'string' && signupCountry.trim().length > 0 ? signupCountry.trim().slice(0, 60) : 'United States',
      bio: '',
      avatar: safeAvatar,
      interests: validInterests,
      language: validLanguage,
      auto_translate: true,
      default_mode: 'just_chat',
      notifications: { email: Boolean(marketing_consent), push: false },
      marketing_consent: Boolean(marketing_consent),
      trust_score: 95,
      banned: false,
      blocked_ids: [],
      created_at: new Date().toISOString(),
    };

    store.users.push(newUser);
    saveStore(store);

    const accessToken = signToken({ sub: newUser.id, type: 'access' }, 3600);
    const refreshToken = signToken({ sub: newUser.id, type: 'refresh' }, 7 * 24 * 3600);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: sanitizeUser(newUser),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = store.users.find((u) => u.email === normalizedEmail);
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (user.banned) {
      res.status(403).json({ error: 'This account has been suspended for community safety.' });
      return;
    }

    const accessToken = signToken({ sub: user.id, type: 'access' }, 3600);
    const refreshToken = signToken({ sub: user.id, type: 'refresh' }, 7 * 24 * 3600);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/auth/refresh', (req, res) => {
    if (!isSameOriginOrXhr(req)) {
      res.status(403).json({ error: 'Cross-origin refresh rejected.' });
      return;
    }
    const cookies = parseCookies(req);
    const token = cookies.helo_refresh;
    if (!token) {
      res.status(401).json({ error: 'No active session.' });
      return;
    }
    const payload = verifyToken(token, 'refresh');
    if (!payload) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Session expired.' });
      return;
    }
    const user = store.users.find((u) => u.id === payload.sub);
    if (!user || user.banned) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Account unavailable.' });
      return;
    }

    const accessToken = signToken({ sub: user.id, type: 'access' }, 3600);
    res.json({
      accessToken,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    if (!isSameOriginOrXhr(req)) {
      res.status(403).json({ error: 'Cross-origin logout rejected.' });
      return;
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body ?? {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const normalized = email.trim().toLowerCase();

    // Always record the request (for audit log)
    store.passwordResetRequests.push({
      email: normalized,
      requested_at: new Date().toISOString(),
    });

    const user = store.users.find((u) => u.email === normalized);
    if (user) {
      // Expire any existing token for this user
      store.passwordResetTokens = store.passwordResetTokens.filter((t) => t.user_id !== user.id);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      store.passwordResetTokens.push({
        token: rawToken,
        user_id: user.id,
        expires_at: expires,
      });
      saveStore(store);

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

      // Try to send via SMTP if configured; otherwise log to console
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Minimal SMTP send using raw TCP — no external library required
        sendResetEmail(user.email, user.display_name, resetLink).catch((err) => {
          console.error('[reset-email] Failed to send:', err);
        });
      } else {
        // No SMTP configured — print link to console for development use
        console.log(
          `\n[Password Reset] No SMTP configured. Reset link for ${user.email}:\n${resetLink}\n`
        );
      }
    } else {
      saveStore(store);
    }

    res.json({
      ok: true,
      message: 'If an account matches that email, password reset instructions have been sent.',
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof token !== 'string' || !token.trim()) {
      res.status(400).json({ error: 'Reset token is required.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const record = store.passwordResetTokens.find((t) => t.token === token.trim());
    if (!record) {
      res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }
    if (new Date(record.expires_at) < new Date()) {
      store.passwordResetTokens = store.passwordResetTokens.filter((t) => t.token !== token);
      saveStore(store);
      res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
      return;
    }

    const user = store.users.find((u) => u.id === record.user_id);
    if (!user) {
      res.status(400).json({ error: 'Account not found.' });
      return;
    }

    user.password_hash = hashPassword(password);
    // Consume the token so it cannot be reused
    store.passwordResetTokens = store.passwordResetTokens.filter((t) => t.token !== token);
    saveStore(store);

    res.json({ ok: true, message: 'Password updated successfully. You can now log in.' });
  });

  // ---- User profile & settings endpoints ----
  app.get('/api/users/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: sanitizeUser(req.user!) });
  });

  app.patch('/api/users/me', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const {
      display_name,
      gender,
      country,
      age,
      bio,
      avatar,
      interests,
      language,
      auto_translate,
      default_mode,
      notifications,
    } = req.body ?? {};

    if (typeof display_name === 'string' && display_name.trim().length >= 2 && display_name.trim().length <= 40) {
      user.display_name = display_name.trim();
    }
    if (gender === 'male' || gender === 'female' || gender === 'non-binary') {
      user.gender = gender;
    }
    if (typeof country === 'string' && country.trim().length > 0 && country.trim().length <= 60) {
      user.country = country.trim();
    }
    if (typeof age === 'number' && age >= 18 && age <= 120) {
      user.age = Math.floor(age);
    }
    if (typeof bio === 'string' && bio.length <= 280) {
      user.bio = bio.trim();
    }
    if (typeof avatar === 'string' && isSafeMediaUrl(avatar)) {
      user.avatar = avatar;
    }
    if (Array.isArray(interests)) {
      user.interests = interests
        .filter((i): i is string => typeof i === 'string' && INTERESTS.includes(i))
        .slice(0, 5);
    }
    if (typeof language === 'string' && LANGUAGES.some((l) => l.code === language)) {
      user.language = language;
    }
    if (typeof auto_translate === 'boolean') {
      user.auto_translate = auto_translate;
    }
    if (typeof default_mode === 'string' && CONVERSATION_MODES.some((m) => m.id === default_mode)) {
      user.default_mode = default_mode;
    }
    if (notifications && typeof notifications === 'object') {
      user.notifications = {
        email: Boolean(notifications.email),
        push: Boolean(notifications.push),
      };
    }

    saveStore(store);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/users/me/delete', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    store.users = store.users.filter((u) => u.id !== userId);
    saveStore(store);
    clearRefreshCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/users/me/export', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const userStories = store.stories.filter(
      (s) => s.author_name.toLowerCase() === user.display_name.toLowerCase()
    );
    res.setHeader('Content-Disposition', `attachment; filename="helo-data-${user.slug}.json"`);
    res.json({
      exported_at: new Date().toISOString(),
      account: sanitizeUser(user),
      stories: userStories,
    });
  });

  app.get('/api/users/profile/:slug', (req, res) => {
    const slug = String(req.params.slug || '').toLowerCase();
    const user = store.users.find((u) => u.slug.toLowerCase() === slug && !u.banned);
    if (!user) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }
    res.json({
      profile: {
        slug: user.slug,
        display_name: user.display_name,
        country: user.country,
        age: user.age,
        bio: user.bio,
        avatar: user.avatar,
        interests: user.interests,
        language: user.language,
        trust_score: user.trust_score,
        created_at: user.created_at,
      },
    });
  });

  app.post('/api/users/session/:id/block', (req, res) => {
    const sessionId = String(req.params.id || '');
    const session = activeSessions.get(sessionId);
    const auth = req.headers.authorization;
    let requesterUser: UserRecord | undefined;
    if (auth?.startsWith('Bearer ')) {
      const payload = verifyToken(auth.slice(7), 'access');
      if (payload) {
        requesterUser = store.users.find((u) => u.id === payload.sub);
      }
    }

    if (requesterUser && session) {
      const partner = session.users.find((u) => u.userId !== requesterUser!.id);
      if (partner && partner.userId && !requesterUser.blocked_ids.includes(partner.userId)) {
        requesterUser.blocked_ids.push(partner.userId);
        saveStore(store);
      }
    }
    res.json({ ok: true, blockedSession: sessionId });
  });

  // ---- Stories endpoints ----
  app.get('/api/stories', (req, res) => {
    // Community-privacy stories are only visible to authenticated users
    let stories = store.stories;
    const auth = req.headers.authorization;
    let isAuthed = false;
    if (auth?.startsWith('Bearer ')) {
      const payload = verifyToken(auth.slice(7), 'access');
      if (payload && store.users.find((u) => u.id === payload.sub)) {
        isAuthed = true;
      }
    }
    if (!isAuthed) {
      stories = stories.filter((s) => s.privacy === 'public');
    }
    res.json({ stories });
  });

  app.post('/api/stories', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const { category, title, caption, media_url, privacy, location } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120) {
      res.status(400).json({ error: 'Story headline must be between 3 and 120 characters.' });
      return;
    }
    if (typeof caption !== 'string' || caption.trim().length < 5 || caption.trim().length > 500) {
      res.status(400).json({ error: 'Story text must be between 5 and 500 characters.' });
      return;
    }
    const safeMedia =
      typeof media_url === 'string' && media_url.trim() && isSafeMediaUrl(media_url.trim())
        ? media_url.trim()
        : '/src/assets/images/story_friendship_1795686520171.jpg';

    const newStory: StoryRecord = {
      id: `story-${crypto.randomUUID()}`,
      author_name: user.display_name,
      author_handle: `@${user.slug}`,
      category: typeof category === 'string' && category.trim() ? category.trim().slice(0, 24) : 'Friendship',
      title: title.trim(),
      caption: caption.trim(),
      media_url: safeMedia,
      privacy: privacy === 'community' ? 'community' : 'public',
      created_at: new Date().toISOString(),
      location: typeof location === 'string' && location.trim() ? location.trim().slice(0, 48) : 'Global',
    };

    store.stories.unshift(newStory);
    saveStore(store);
    res.status(201).json({ story: newStory });
  });

  // ---- Reports, Consent Proxy & Unsubscribe ----
  app.post('/api/reports', (req, res) => {
    const { session_id, reason, details, reported_name, reported_user_id } = req.body ?? {};
    if (typeof reason !== 'string' || !REPORT_REASONS.some((r) => r.id === reason)) {
      res.status(400).json({ error: 'Please select a valid report reason.' });
      return;
    }
    const report: ReportRecord = {
      id: `rep-${crypto.randomUUID().slice(0, 8)}`,
      session_id: typeof session_id === 'string' ? session_id : 'direct',
      reporter_id: 'session-user',
      reported_user_id: typeof reported_user_id === 'string' ? reported_user_id : 'guest',
      reported_name:
        typeof reported_name === 'string' && reported_name.trim() ? reported_name.trim() : 'Anonymous Partner',
      reason,
      details: typeof details === 'string' ? details.trim().slice(0, 600) : '',
      status: 'open',
      created_at: new Date().toISOString(),
    };
    store.reports.unshift(report);
    saveStore(store);
    res.status(201).json({ report });
  });

  app.post('/api/consent-proxy', (req, res) => {
    const { essential, analytics, translation_memory } = req.body ?? {};
    const entry = {
      id: `consent-${crypto.randomUUID().slice(0, 8)}`,
      preferences: {
        essential: true,
        analytics: Boolean(analytics),
        translation_memory: Boolean(translation_memory),
      },
      timestamp: new Date().toISOString(),
    };
    store.consentLogs.push(entry);
    saveStore(store);
    res.json({ ok: true, consent: entry });
  });

  app.post('/api/unsubscribe', (req, res) => {
    const { email, reason } = req.body ?? {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!store.unsubscribedEmails.includes(normalized)) {
      store.unsubscribedEmails.push(normalized);
    }
    const user = store.users.find((u) => u.email === normalized);
    if (user) {
      user.marketing_consent = false;
      user.notifications.email = false;
    }
    saveStore(store);
    res.json({ ok: true, email: normalized, reason: typeof reason === 'string' ? reason : '' });
  });

  // ---- Server-side Gemini AI endpoints ----
  app.post('/api/ai/icebreaker', async (req, res) => {
    try {
      const { mode, shared_interests } = req.body ?? {};
      const safeMode = typeof mode === 'string' ? mode : 'just_chat';
      const safeInterests = Array.isArray(shared_interests)
        ? shared_interests.filter((i): i is string => typeof i === 'string').slice(0, 5)
        : [];
      const prompt = await generateIcebreakerWithGemini(safeMode, safeInterests);
      res.json({ icebreaker: prompt });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate icebreaker.';
      res.status(503).json({ error: message });
    }
  });

  app.post('/api/ai/translate', async (req, res) => {
    try {
      const { text, target_language, source_language } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
        res.status(400).json({ error: 'Text must be between 1 and 2000 characters.' });
        return;
      }
      if (typeof target_language !== 'string' || !LANGUAGES.some((l) => l.code === target_language)) {
        res.status(400).json({ error: 'Invalid target language.' });
        return;
      }
      const result = await translateTextWithGemini(
        text.trim(),
        target_language,
        typeof source_language === 'string' ? source_language : undefined
      );
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation service unavailable.';
      res.status(503).json({ error: message });
    }
  });

  // ---- Admin Moderation Console endpoints ----
  app.get('/api/admin/status', (req, res) => {
    const hasEnvPasscode = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
    const configured = hasEnvPasscode || Boolean(store.adminCredentialHash);
    let authenticated = false;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      authenticated = Boolean(verifyToken(auth.slice(7), 'admin'));
    }
    res.json({ configured, authenticated, usingEnvPasscode: hasEnvPasscode });
  });

  app.post('/api/admin/claim', (req, res) => {
    if (process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0) {
      res.status(409).json({ error: 'Admin passcode is managed via server environment configuration.' });
      return;
    }
    if (store.adminCredentialHash) {
      res.status(409).json({ error: 'Admin access has already been claimed. Please sign in.' });
      return;
    }
    const { passcode } = req.body ?? {};
    if (typeof passcode !== 'string' || passcode.trim().length < 6) {
      res.status(400).json({ error: 'Choose an admin passcode of at least 6 characters.' });
      return;
    }
    store.adminCredentialHash = hashPassword(passcode.trim());
    saveStore(store);

    const adminToken = signToken({ sub: 'admin', type: 'admin' }, 4 * 3600);
    res.status(201).json({ adminToken });
  });

  app.post('/api/admin/login', (req, res) => {
    const { passcode } = req.body ?? {};
    if (typeof passcode !== 'string' || !passcode.trim()) {
      res.status(400).json({ error: 'Passcode is required.' });
      return;
    }
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    let valid = false;

    if (envPasscode && envPasscode.length > 0) {
      const a = crypto.createHash('sha256').update(passcode.trim()).digest();
      const b = crypto.createHash('sha256').update(envPasscode).digest();
      valid = crypto.timingSafeEqual(a, b);
    } else if (store.adminCredentialHash) {
      valid = verifyPassword(passcode.trim(), store.adminCredentialHash);
    } else {
      res.status(400).json({ error: 'Admin access has not been configured yet.' });
      return;
    }

    if (!valid) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }

    const adminToken = signToken({ sub: 'admin', type: 'admin' }, 4 * 3600);
    res.json({ adminToken });
  });

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const openReports = store.reports.filter((r) => r.status === 'open').length;
    const resolvedToday = store.reports.filter(
      (r) => r.status === 'resolved' && (r.resolved_at || r.created_at).startsWith(todayPrefix)
    ).length;

    res.json({
      stats: {
        active_sessions: activeSessions.size,
        waiting_queue: matchmakingQueue.length,
        open_reports: openReports,
        resolved_today: resolvedToday,
        online_users: io.engine.clientsCount,
      },
      reports: store.reports,
      users: store.users.map((u) => ({
        id: u.id,
        display_name: u.display_name,
        email: u.email,
        country: u.country,
        trust_score: u.trust_score,
        banned: u.banned,
        created_at: u.created_at,
      })),
    });
  });

  app.post('/api/admin/reports/:id/resolve', requireAdmin, (req, res) => {
    const report = store.reports.find((r) => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    report.status = report.status === 'open' ? 'resolved' : 'open';
    report.resolved_at = report.status === 'resolved' ? new Date().toISOString() : undefined;
    saveStore(store);
    res.json({ report });
  });

  app.post('/api/admin/users/:id/toggle-ban', requireAdmin, (req, res) => {
    const user = store.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    user.banned = !user.banned;
    saveStore(store);
    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        banned: user.banned,
      },
    });
  });

  // ---- Real-Time Socket.IO Matchmaking + WebRTC Signaling ----
  interface QueueEntry {
    socket: Socket;
    socketId: string;
    userId: string;
    displayName: string;
    age: number;
    country: string;
    gender: 'male' | 'female' | 'non-binary';
    genderFilter: 'everyone' | 'male' | 'female';
    countryFilter: string;
    mode: string;
    callMode: 'video' | 'audio' | 'text';
    language: string;
    interests: string[];
    autoTranslate: boolean;
    trustScore: number;
    avatar: string;
  }

  interface ActiveSession {
    id: string;
    mode: string;
    callMode: string;
    users: QueueEntry[];
    timer?: NodeJS.Timeout;
  }

  const matchmakingQueue: QueueEntry[] = [];
  const activeSessions = new Map<string, ActiveSession>();
  const socketToSession = new Map<string, string>();

  function removeFromQueue(socketId: string) {
    const idx = matchmakingQueue.findIndex((q) => q.socketId === socketId);
    if (idx !== -1) {
      matchmakingQueue.splice(idx, 1);
    }
  }

  function endSessionForSocket(socketId: string, reason = 'partner_left') {
    const sessionId = socketToSession.get(socketId);
    if (!sessionId) return;
    const session = activeSessions.get(sessionId);
    if (session) {
      if (session.timer) clearInterval(session.timer);
      for (const participant of session.users) {
        socketToSession.delete(participant.socketId);
        participant.socket.leave(sessionId);
        if (participant.socketId !== socketId) {
          participant.socket.emit('partner-left', { session_id: sessionId, reason });
        }
      }
      activeSessions.delete(sessionId);
    } else {
      socketToSession.delete(socketId);
    }
  }

  function areCompatible(a: QueueEntry, b: QueueEntry): boolean {
    if (a.socketId === b.socketId) return false;
    if (a.mode !== b.mode) return false;
    if (a.genderFilter !== 'everyone' && b.gender !== a.genderFilter) return false;
    if (b.genderFilter !== 'everyone' && a.gender !== b.genderFilter) return false;
    if (a.countryFilter !== 'Anywhere' && b.country !== a.countryFilter) return false;
    if (b.countryFilter !== 'Anywhere' && a.country !== b.countryFilter) return false;

    const userA = store.users.find((u) => u.id === a.userId);
    const userB = store.users.find((u) => u.id === b.userId);
    if (userA?.blocked_ids.includes(b.userId)) return false;
    if (userB?.blocked_ids.includes(a.userId)) return false;

    return true;
  }

  function scorePair(a: QueueEntry, b: QueueEntry): number {
    const shared = a.interests.filter((i) => b.interests.includes(i)).length;
    const diffLangBonus = a.mode === 'language_practice' && a.language !== b.language ? 3 : 0;
    const sameCallModeBonus = a.callMode === b.callMode ? 2 : 0;
    // Prefer partners with higher average trust score (normalized to 0-2 bonus range)
    const avgTrust = (a.trustScore + b.trustScore) / 2;
    const trustBonus = avgTrust >= 90 ? 2 : avgTrust >= 75 ? 1 : 0;
    return shared * 2 + diffLangBonus + sameCallModeBonus + trustBonus;
  }

  function broadcastOnlineCount() {
    io.emit('online-count', {
      online: io.engine.clientsCount,
      searching: matchmakingQueue.length,
      inCalls: activeSessions.size * 2,
    });
  }

  io.on('connection', (socket) => {
    broadcastOnlineCount();

    socket.on('join-queue', (payload: Partial<QueueEntry> & { token?: string }) => {
      removeFromQueue(socket.id);
      endSessionForSocket(socket.id, 'requeued');

      let authedUser: UserRecord | undefined;
      if (payload?.token) {
        const verified = verifyToken(payload.token, 'access');
        if (verified) {
          authedUser = store.users.find((u) => u.id === verified.sub);
        }
      }

      if (authedUser?.banned) {
        socket.emit('queue-error', { error: 'Account suspended for safety violations.' });
        return;
      }

      const entry: QueueEntry = {
        socket,
        socketId: socket.id,
        userId: authedUser?.id || `guest-${socket.id.slice(0, 6)}`,
        displayName:
          authedUser?.display_name ||
          (typeof payload?.displayName === 'string' && payload.displayName.trim()
            ? payload.displayName.trim().slice(0, 32)
            : `Guest ${socket.id.slice(0, 4).toUpperCase()}`),
        age: authedUser?.age || 22,
        country: authedUser?.country || (typeof payload?.country === 'string' ? payload.country : 'United States'),
        gender: authedUser?.gender || (payload?.gender === 'male' || payload?.gender === 'female' ? payload.gender : 'non-binary'),
        genderFilter:
          payload?.genderFilter === 'male' || payload?.genderFilter === 'female' ? payload.genderFilter : 'everyone',
        countryFilter: typeof payload?.countryFilter === 'string' && payload.countryFilter ? payload.countryFilter : 'Anywhere',
        mode:
          typeof payload?.mode === 'string' && CONVERSATION_MODES.some((m) => m.id === payload.mode)
            ? payload.mode
            : 'just_chat',
        callMode:
          payload?.callMode === 'audio' || payload?.callMode === 'text' ? payload.callMode : 'video',
        language:
          typeof payload?.language === 'string' && LANGUAGES.some((l) => l.code === payload.language)
            ? payload.language
            : authedUser?.language || 'en',
        interests: Array.isArray(payload?.interests)
          ? payload.interests.filter((i): i is string => typeof i === 'string').slice(0, 5)
          : authedUser?.interests || [],
        autoTranslate: Boolean(payload?.autoTranslate ?? true),
        trustScore: authedUser?.trust_score ?? 94,
        avatar: authedUser?.avatar || '',
      };

      // Find best compatible match in queue
      let bestMatchIdx = -1;
      let bestScore = -1;
      for (let i = 0; i < matchmakingQueue.length; i++) {
        const candidate = matchmakingQueue[i];
        if (!areCompatible(entry, candidate)) continue;
        const s = scorePair(entry, candidate);
        if (s > bestScore) {
          bestScore = s;
          bestMatchIdx = i;
        }
      }

      if (bestMatchIdx !== -1) {
        const partner = matchmakingQueue.splice(bestMatchIdx, 1)[0];
        const sessionId = `sess-${crypto.randomUUID()}`;
        const sharedInterests = entry.interests.filter((i) => partner.interests.includes(i));
        const negotiatedCallMode =
          entry.callMode === 'text' || partner.callMode === 'text'
            ? 'text'
            : entry.callMode === 'audio' || partner.callMode === 'audio'
              ? 'audio'
              : 'video';

        const session: ActiveSession = {
          id: sessionId,
          mode: entry.mode,
          callMode: negotiatedCallMode,
          users: [partner, entry],
        };

        activeSessions.set(sessionId, session);
        socketToSession.set(partner.socketId, sessionId);
        socketToSession.set(entry.socketId, sessionId);

        partner.socket.join(sessionId);
        entry.socket.join(sessionId);

        partner.socket.emit('matched', {
          session_id: sessionId,
          is_initiator: true,
          mode: entry.mode,
          call_mode: negotiatedCallMode,
          shared_interests: sharedInterests,
          other_user: {
            id: entry.userId,
            display_name: entry.displayName,
            age: entry.age,
            country: entry.country,
            language: entry.language,
            trust_score: entry.trustScore,
            interests: entry.interests,
            avatar: entry.avatar,
          },
        });

        entry.socket.emit('matched', {
          session_id: sessionId,
          is_initiator: false,
          mode: entry.mode,
          call_mode: negotiatedCallMode,
          shared_interests: sharedInterests,
          other_user: {
            id: partner.userId,
            display_name: partner.displayName,
            age: partner.age,
            country: partner.country,
            language: partner.language,
            trust_score: partner.trustScore,
            interests: partner.interests,
            avatar: partner.avatar,
          },
        });

        if (entry.mode === 'speed_round') {
          let remaining = 60;
          io.to(sessionId).emit('speed-round-tick', { remaining });
          session.timer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
              if (session.timer) clearInterval(session.timer);
              io.to(sessionId).emit('speed-round-ended', { session_id: sessionId });
            } else {
              io.to(sessionId).emit('speed-round-tick', { remaining });
            }
          }, 1000);
        }

        broadcastOnlineCount();
      } else {
        matchmakingQueue.push(entry);
        socket.emit('queue-status', {
          status: 'searching',
          position: matchmakingQueue.length,
          online: io.engine.clientsCount,
        });
        broadcastOnlineCount();
      }
    });

    socket.on('next', () => {
      removeFromQueue(socket.id);
      endSessionForSocket(socket.id, 'skipped');
      broadcastOnlineCount();
      // Re-add the socket to the queue only if the client requests it via join-queue
      // (the client must call join-queue explicitly after 'next' in speed_round mode)
    });

    socket.on('leave-session', () => {
      removeFromQueue(socket.id);
      endSessionForSocket(socket.id, 'ended');
      broadcastOnlineCount();
    });

    socket.on('typing', (data: { isTyping?: boolean }) => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      socket.to(sessionId).emit('typing', { isTyping: Boolean(data?.isTyping) });
    });

    socket.on('send-message', async (data: { text?: string }) => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;

      const rawText = typeof data?.text === 'string' ? data.text.trim() : '';
      if (!rawText || rawText.length > 2000) return;

      const sender = session.users.find((u) => u.socketId === socket.id);
      const receiver = session.users.find((u) => u.socketId !== socket.id);
      if (!sender || !receiver) return;

      const msgId = `msg-${crypto.randomUUID()}`;
      const timestamp = new Date().toISOString();

      let translatedText: string | undefined;
      let translatedTo: string | undefined;

      if (receiver.autoTranslate && sender.language !== receiver.language && ai) {
        try {
          const result = await translateTextWithGemini(rawText, receiver.language, sender.language);
          translatedText = result.translatedText;
          translatedTo = receiver.language;
        } catch {
          // Deliver original text if translation fails cleanly
        }
      }

      sender.socket.emit('receive-message', {
        id: msgId,
        sender: 'me',
        senderName: sender.displayName,
        text: rawText,
        timestamp,
      });

      receiver.socket.emit('receive-message', {
        id: msgId,
        sender: 'partner',
        senderName: sender.displayName,
        text: rawText,
        translatedText,
        translatedTo,
        timestamp,
      });
    });

    socket.on('get-icebreaker', async () => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;

      const [u1, u2] = session.users;
      const shared = u1 && u2 ? u1.interests.filter((i) => u2.interests.includes(i)) : [];

      try {
        const prompt = await generateIcebreakerWithGemini(session.mode, shared);
        io.to(sessionId).emit('icebreaker', { text: prompt });
      } catch (err) {
        socket.emit('icebreaker-error', {
          error: err instanceof Error ? err.message : 'Unable to generate icebreaker right now.',
        });
      }
    });

    socket.on('friend-request', () => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      socket.to(sessionId).emit('friend-request', { fromSocketId: socket.id });
    });

    socket.on('friend-accept', () => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;

      // Find both participants
      const acceptor = session.users.find((u) => u.socketId === socket.id);
      const requester = session.users.find((u) => u.socketId !== socket.id);
      if (!acceptor || !requester) return;

      // Record persistent friend connection if both are real users
      if (acceptor.userId && requester.userId && !acceptor.userId.startsWith('guest-') && !requester.userId.startsWith('guest-')) {
        const existing = store.friends.find(
          (f) =>
            (f.requester_id === requester.userId && f.addressee_id === acceptor.userId) ||
            (f.requester_id === acceptor.userId && f.addressee_id === requester.userId)
        );
        if (!existing) {
          store.friends.push({
            id: `friend-${crypto.randomUUID().slice(0, 8)}`,
            requester_id: requester.userId,
            addressee_id: acceptor.userId,
            status: 'accepted',
            created_at: new Date().toISOString(),
          });
          saveStore(store);
        }
      }

      // Notify both sides
      io.to(sessionId).emit('friend-accepted', {
        users: session.users.map((u) => ({
          id: u.userId,
          display_name: u.displayName,
        })),
      });
    });

    socket.on('offer', (data: { sdp: unknown }) => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      socket.to(sessionId).emit('offer', { sdp: data?.sdp });
    });

    socket.on('answer', (data: { sdp: unknown }) => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      socket.to(sessionId).emit('answer', { sdp: data?.sdp });
    });

    socket.on('ice-candidate', (data: { candidate: unknown }) => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      socket.to(sessionId).emit('ice-candidate', { candidate: data?.candidate });
    });

    socket.on('rate-partner', (data: { userId?: string; rating?: 'up' | 'down' }) => {
      if (!data?.userId) return;
      const user = store.users.find((u) => u.id === data.userId);
      if (!user) return;
      if (data.rating === 'up') {
        user.trust_score = Math.min(100, user.trust_score + 1);
      } else if (data.rating === 'down') {
        user.trust_score = Math.max(10, user.trust_score - 3);
      }
      saveStore(store);
    });

    socket.on('disconnect', () => {
      removeFromQueue(socket.id);
      endSessionForSocket(socket.id, 'disconnected');
      broadcastOnlineCount();
    });
  });

  // ---- Vite Dev Middleware or Static Production Serve ----
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Helo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
