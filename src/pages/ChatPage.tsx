import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Ban,
  Camera,
  CameraOff,
  Flag,
  Languages,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  PhoneOff,
  Send,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from '../components/Header';
import { PersonAvatar } from '../components/PersonAvatar';
import { SearchingSignalGraphic, VoiceWaveformGraphic } from '../components/LiveMatchGraphic';
import {
  CONVERSATION_MODES,
  COUNTRIES,
  INTERESTS,
  LANGUAGES,
  REPORT_REASONS,
} from '../shared/constants';
import { apiRequest, fetchTurnCredentials, getAccessToken } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type ChatState = 'idle' | 'searching' | 'matched' | 'connected' | 'disconnected';
type CallMode = 'video' | 'audio' | 'text';

interface PartnerInfo {
  id: string;
  display_name: string;
  age: number;
  country: string;
  language: string;
  trust_score: number;
  interests: string[];
  avatar?: string;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'partner' | 'system';
  senderName?: string;
  text: string;
  translatedText?: string;
  translatedTo?: string;
  timestamp: string;
}

export function ChatPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();

  // Preferences & filters
  const initialMode = useMemo(() => {
    const m = searchParams.get('mode');
    return CONVERSATION_MODES.some((item) => item.id === m)
      ? (m as (typeof CONVERSATION_MODES)[number]['id'])
      : (user?.default_mode as (typeof CONVERSATION_MODES)[number]['id']) || 'just_chat';
  }, [searchParams, user?.default_mode]);

  const initialInterests = useMemo(() => {
    const raw = searchParams.get('interests');
    if (raw) {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => INTERESTS.includes(s))
        .slice(0, 5);
    }
    return user?.interests?.slice(0, 5) || ['Music', 'Travel'];
  }, [searchParams, user?.interests]);

  const [mode, setMode] = useState(initialMode);
  const [callMode, setCallMode] = useState<CallMode>('video');
  const [genderFilter, setGenderFilter] = useState<'everyone' | 'male' | 'female'>('everyone');
  const [countryFilter, setCountryFilter] = useState('Anywhere');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [autoTranslate, setAutoTranslate] = useState(user?.auto_translate ?? true);
  const [showInterestsDrawer, setShowInterestsDrawer] = useState(false);

  // Session & WebRTC state
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [lastPartner, setLastPartner] = useState<PartnerInfo | null>(null);
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  const [negotiatedCallMode, setNegotiatedCallMode] = useState<CallMode>('video');
  const [onlineStats, setOnlineStats] = useState({ online: 1, searching: 0, inCalls: 0 });
  const [speedTimer, setSpeedTimer] = useState<number | null>(null);

  // Media controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  // Messaging & icebreaker
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
  const [friendSent, setFriendSent] = useState(false);
  const [friendReceived, setFriendReceived] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<'up' | 'down' | null>(null);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASONS)[number]['id']>('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Keep refs updated for Socket callbacks
  const callModeRef = useRef(callMode);
  callModeRef.current = callMode;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setHasRemoteStream(false);
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const ensureLocalMedia = useCallback(async (requestedMode: CallMode) => {
    if (requestedMode === 'text') {
      stopLocalMedia();
      return null;
    }
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaNotice('Camera/microphone API unavailable here; continuing with text chat.');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: requestedMode === 'video',
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaNotice(null);
      setMicEnabled(true);
      setCamEnabled(requestedMode === 'video');
      return stream;
    } catch {
      setMediaNotice('Camera or microphone permission unavailable. Continuing in text-ready mode.');
      return null;
    }
  }, [stopLocalMedia]);

  const setupPeerConnection = useCallback(
    async (isInitiator: boolean, activeCallMode: CallMode) => {
      cleanupPeerConnection();
      let iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const creds = await fetchTurnCredentials();
        if (creds.iceServers?.length) {
          iceServers = creds.iceServers as RTCIceServer[];
        }
      } catch {
        // use default STUN
      }

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      const stream = await ensureLocalMedia(activeCallMode);
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          setHasRemoteStream(true);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setChatState('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Fall back to text chat so the conversation can continue
          setNegotiatedCallMode('text');
          setChatState('connected');
          setMediaNotice(
            pc.connectionState === 'failed'
              ? 'Peer-to-peer video connection failed. Switched to text chat.'
              : 'Video connection lost. Continuing in text mode.'
          );
          cleanupPeerConnection();
        } else if (pc.connectionState === 'closed') {
          cleanupPeerConnection();
        }
      };

      if (isInitiator && activeCallMode !== 'text') {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: activeCallMode === 'video',
        });
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('offer', { sdp: offer });
      }
    },
    [cleanupPeerConnection, ensureLocalMedia]
  );

  // Connect Socket.IO once on mount
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('online-count', (stats: { online: number; searching: number; inCalls: number }) => {
      setOnlineStats(stats);
    });

    socket.on('queue-status', () => {
      setChatState('searching');
    });

    socket.on('queue-error', (data: { error?: string }) => {
      setStatusBanner(data?.error || 'Unable to join matchmaking queue.');
      setChatState('idle');
    });

    socket.on(
      'matched',
      async (data: {
        session_id: string;
        is_initiator: boolean;
        mode: string;
        call_mode: CallMode;
        shared_interests: string[];
        other_user: PartnerInfo;
      }) => {
        setSessionId(data.session_id);
        setPartner(data.other_user);
        setLastPartner(data.other_user);
        setSharedInterests(data.shared_interests || []);
        setNegotiatedCallMode(data.call_mode);
        setMessages([
          {
            id: `sys-${Date.now()}`,
            sender: 'system',
            text: `Matched with ${data.other_user.display_name} (${data.other_user.country}). Say hello!`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setIcebreaker(null);
        setFriendSent(false);
        setFriendReceived(false);
        setRatingSubmitted(null);
        setPartnerTyping(false);
        setStatusBanner(null);
        setSpeedTimer(data.mode === 'speed_round' ? 60 : null);
        setChatState(data.call_mode === 'text' ? 'connected' : 'matched');

        await setupPeerConnection(data.is_initiator, data.call_mode);
        if (data.mode === 'deep_talks') {
          socket.emit('get-icebreaker');
        }
      }
    );

    socket.on('offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) {
        await setupPeerConnection(false, callModeRef.current);
      }
      const pc = pcRef.current;
      if (!pc || !data?.sdp) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { sdp: answer });
      setChatState('connected');
    });

    socket.on('answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc || !data?.sdp) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      setChatState('connected');
    });

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !data?.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch {
        // ignore stale candidates
      }
    });

    socket.on('receive-message', (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.sender === 'partner') {
        setPartnerTyping(false);
      }
    });

    socket.on('typing', (data: { isTyping: boolean }) => {
      setPartnerTyping(Boolean(data?.isTyping));
    });

    socket.on('icebreaker', (data: { text: string }) => {
      setIcebreakerLoading(false);
      setIcebreaker(data.text);
      // Clear any pending safety timeout
      const s = socket as Socket & { _icebreakerTimeout?: ReturnType<typeof setTimeout> };
      if (s._icebreakerTimeout) { clearTimeout(s._icebreakerTimeout); s._icebreakerTimeout = undefined; }
    });

    socket.on('icebreaker-error', (data: { error?: string }) => {
      setIcebreakerLoading(false);
      setStatusBanner(data?.error || 'Could not generate icebreaker.');
      const s = socket as Socket & { _icebreakerTimeout?: ReturnType<typeof setTimeout> };
      if (s._icebreakerTimeout) { clearTimeout(s._icebreakerTimeout); s._icebreakerTimeout = undefined; }
    });

    socket.on('speed-round-tick', (data: { remaining: number }) => {
      setSpeedTimer(data.remaining);
    });

    socket.on('speed-round-ended', () => {
      setSpeedTimer(0);
      setStatusBanner('60-second Speed Round complete. Finding your next match…');
      cleanupPeerConnection();
      setPartner(null);
      setSessionId(null);
      // Emit 'next' to clean up the session on the server, then immediately re-join
      socket.emit('next');
      // Re-enter the matchmaking queue for the next speed round
      setTimeout(() => {
        joinQueue(modeRef.current);
      }, 300);
    });

    socket.on('friend-request', () => {
      setFriendReceived(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-friend-${Date.now()}`,
          sender: 'system',
          text: 'Your conversation partner sent a Make-a-Friend connect request.',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    socket.on('friend-accepted', () => {
      setFriendSent(true);
      setFriendReceived(false);
      setMessages((prev) => {
        const partnerName = prev.length > 0 ? undefined : undefined;
        return [
          ...prev,
          {
            id: `sys-friend-accepted-${Date.now()}`,
            sender: 'system',
            text: '🎉 You are now friends! Your connection has been saved.',
            timestamp: new Date().toISOString(),
          },
        ];
      });
    });

    socket.on('partner-left', () => {
      cleanupPeerConnection();
      setSpeedTimer(null);
      setPartnerTyping(false);
      setChatState('disconnected');
      setPartner(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-left-${Date.now()}`,
          sender: 'system',
          text: 'Your partner left the conversation.',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    return () => {
      cleanupPeerConnection();
      stopLocalMedia();
      socket.disconnect();
    };
  }, [cleanupPeerConnection, setupPeerConnection, stopLocalMedia]);

  const joinQueue = useCallback(
    async (overrideMode?: string) => {
      const targetMode = overrideMode || mode;
      setStatusBanner(null);
      setPartner(null);
      setSessionId(null);
      setMessages([]);
      setIcebreaker(null);
      setSpeedTimer(null);
      setRatingSubmitted(null);

      await ensureLocalMedia(callMode);
      setChatState('searching');
      socketRef.current?.emit('join-queue', {
        token: getAccessToken(),
        displayName: user?.display_name,
        country: user?.country || 'United States',
        gender: user?.gender || 'non-binary',
        genderFilter,
        countryFilter,
        mode: targetMode,
        callMode,
        language,
        interests,
        autoTranslate,
      });
    },
    [
      autoTranslate,
      callMode,
      countryFilter,
      ensureLocalMedia,
      genderFilter,
      interests,
      language,
      mode,
      user,
    ]
  );

  const handleNext = () => {
    cleanupPeerConnection();
    socketRef.current?.emit('next');
    joinQueue();
  };

  const handleEndCall = () => {
    cleanupPeerConnection();
    socketRef.current?.emit('leave-session');
    setSpeedTimer(null);
    setPartner(null);
    setSessionId(null);
    setChatState('disconnected');
  };

  const handleToggleMic = () => {
    if (!localStreamRef.current) return;
    const next = !micEnabled;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = next;
    }
    setMicEnabled(next);
  };

  const handleToggleCam = () => {
    if (!localStreamRef.current) return;
    const next = !camEnabled;
    for (const track of localStreamRef.current.getVideoTracks()) {
      track.enabled = next;
    }
    setCamEnabled(next);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !sessionId) return;
    socketRef.current?.emit('send-message', { text });
    socketRef.current?.emit('typing', { isTyping: false });
    setDraft('');
  };

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (!sessionId) return;
    socketRef.current?.emit('typing', { isTyping: val.trim().length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { isTyping: false });
    }, 1500);
  };

  const handleRequestIcebreaker = async () => {
    setIcebreakerLoading(true);
    setStatusBanner(null);
    if (sessionId && socketRef.current) {
      socketRef.current.emit('get-icebreaker');
      // Safety timeout: if server doesn't respond in 10s, unblock the button
      const timeout = setTimeout(() => {
        setIcebreakerLoading((prev) => {
          if (prev) setStatusBanner('Icebreaker request timed out. Try again.');
          return false;
        });
      }, 10000);
      // Store cleanup reference so resolved event clears it
      (socketRef.current as Socket & { _icebreakerTimeout?: ReturnType<typeof setTimeout> })._icebreakerTimeout = timeout;
      return;
    }
    try {
      const res = await apiRequest<{ icebreaker: string }>('/api/ai/icebreaker', {
        method: 'POST',
        body: JSON.stringify({ mode, shared_interests: interests }),
      });
      setIcebreaker(res.icebreaker);
    } catch (err) {
      setStatusBanner(err instanceof Error ? err.message : 'Unable to generate icebreaker.');
    } finally {
      setIcebreakerLoading(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!sessionId) return;
    try {
      await apiRequest(`/api/users/session/${encodeURIComponent(sessionId)}/block`, {
        method: 'POST',
      });
    } catch {
      // still disconnect cleanly
    }
    setStatusBanner('User blocked for future sessions.');
    handleEndCall();
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId || 'disconnected',
          reported_user_id: partner?.id || lastPartner?.id || 'guest',
          reported_name: partner?.display_name || lastPartner?.display_name || 'Partner',
          reason: reportReason,
          details: reportDetails,
        }),
      });
      setReportStatus('Report submitted to our moderation team.');
      setReportDetails('');
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus(null);
      }, 1200);
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : 'Could not submit report.');
    }
  };

  const handleRatePartner = (rating: 'up' | 'down') => {
    if (!lastPartner) return;
    socketRef.current?.emit('rate-partner', { userId: lastPartner.id, rating });
    setRatingSubmitted(rating);
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item)
        ? prev.filter((x) => x !== item)
        : prev.length < 5
          ? [...prev, item]
          : prev
    );
  };

  const isInActiveSession = chatState === 'matched' || chatState === 'connected';

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-900 dark:text-neutral-100 transition-colors overflow-hidden">
      <Header />

      {/* Top Conversation Modes Bar + Filter Bar */}
      <div className="sticky top-[57px] z-30 border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] transition-colors">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-3 space-y-3">
          {/* Row 1: 5 Conversation Mode Tabs + Live Stats + Light/Dark Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Conversation mode" className="flex flex-wrap items-center gap-1.5">
              {CONVERSATION_MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setMode(m.id);
                      if (chatState === 'searching') {
                        joinQueue(m.id);
                      }
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    {m.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-mono tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
                {onlineStats.online} online
              </span>
              <span aria-hidden="true">·</span>
              <span>{onlineStats.searching} waiting</span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/15 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 font-sans text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Match Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <span className="text-neutral-500 dark:text-neutral-400">Match:</span>
              <select
                aria-label="Gender filter"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as 'everyone' | 'male' | 'female')}
                className="rounded-md border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-blue-600 focus:outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <span className="text-neutral-500 dark:text-neutral-400">Region:</span>
              <select
                aria-label="Country filter"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-md border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-blue-600 focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center rounded-md border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] p-0.5">
              {(['video', 'audio', 'text'] as const).map((cm) => (
                <button
                  key={cm}
                  type="button"
                  onClick={() => setCallMode(cm)}
                  className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    callMode === cm
                      ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {cm}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <span className="text-neutral-500 dark:text-neutral-400">Language:</span>
              <select
                aria-label="Your language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-blue-600 focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setShowInterestsDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/30 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
              <span>Interests ({interests.length}/5)</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoTranslate((v) => !v)}
              aria-pressed={autoTranslate}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                autoTranslate
                  ? 'border-blue-600/50 bg-blue-600/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Translate: {autoTranslate ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* Expandable Interests Picker */}
          {showInterestsDrawer && (
            <div className="rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Select up to 5 interests for smarter matching ({interests.length}/5)
                </p>
                <button
                  type="button"
                  onClick={() => setShowInterestsDrawer(false)}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Workspace: Video Stage + Chat Sidebar */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: Video / Call Stage */}
        <section className="lg:col-span-8 flex flex-col gap-3 min-h-[380px] lg:min-h-0 lg:h-full">
          {statusBanner && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3">
              <span>{statusBanner}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                aria-label="Dismiss notice"
                className="text-amber-700 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {mediaNotice && (
            <div className="rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] px-4 py-2 text-xs text-neutral-600 dark:text-neutral-300">
              {mediaNotice}
            </div>
          )}

          {/* Stage Viewport */}
          <div className="relative flex-1 overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] flex items-center justify-center transition-colors min-h-[300px]">
            {/* Remote Video element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                isInActiveSession && hasRemoteStream && negotiatedCallMode === 'video'
                  ? 'block'
                  : 'hidden'
              }`}
            />

            {/* Partner overlay when connected in audio/text or waiting for remote track */}
            {isInActiveSession && (!hasRemoteStream || negotiatedCallMode !== 'video') && partner && (
              <div className="flex flex-col items-center text-center px-6 py-10">
                <PersonAvatar name={partner.display_name} src={partner.avatar} size="xl" />
                <h2 className="mt-4 font-display text-xl font-bold text-neutral-950 dark:text-white">
                  {partner.display_name}
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {partner.age} · {partner.country} · Trust {partner.trust_score}%
                </p>
                <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-300">
                  {negotiatedCallMode === 'text'
                    ? 'Text chat session active'
                    : negotiatedCallMode === 'audio'
                      ? 'Voice call active'
                      : 'Connecting peer-to-peer video…'}
                </p>
                {negotiatedCallMode === 'audio' && <VoiceWaveformGraphic />}
              </div>
            )}

            {/* Idle / Searching / Disconnected Stage States */}
            {chatState === 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md text-center px-6 py-12"
              >
                <div className="mx-auto mb-4 w-12 h-12 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-blue-600 dark:text-blue-500">
                  <Video className="w-6 h-6" />
                </div>
                <h1 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                  Ready when you are
                </h1>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Mode:{' '}
                  <span className="text-neutral-950 dark:text-white font-medium">
                    {CONVERSATION_MODES.find((m) => m.id === mode)?.title}
                  </span>{' '}
                  · Format:{' '}
                  <span className="text-neutral-950 dark:text-white font-medium capitalize">
                    {callMode}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => joinQueue()}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <span>Start matching</span>
                </button>
              </motion.div>
            )}

            {chatState === 'searching' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md text-center px-6 py-12"
              >
                <SearchingSignalGraphic />
                <h2 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                  Looking for a match…
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Searching {countryFilter === 'Anywhere' ? 'worldwide' : countryFilter} for{' '}
                  {CONVERSATION_MODES.find((m) => m.id === mode)?.title}.
                </p>
                <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Testing solo? Open a second browser tab on{' '}
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">/chat</span>{' '}
                  and click Start matching to pair two real sessions.
                </p>
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="mt-6 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-white/5 px-4 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cancel search
                </button>
              </motion.div>
            )}

            {chatState === 'disconnected' && (
              <div className="max-w-md text-center px-6 py-12">
                <h2 className="font-display text-xl font-bold text-neutral-950 dark:text-white">
                  Session ended
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Rate your last conversation in the sidebar or start a new match anytime.
                </p>
                <button
                  type="button"
                  onClick={() => joinQueue()}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <span>Find next match</span>
                </button>
              </div>
            )}

            {/* Top-left Partner Identity + Shared Interests Overlay */}
            {isInActiveSession && partner && (
              <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
                <div className="rounded-lg bg-black/75 backdrop-blur-md border border-white/10 px-3.5 py-2 pointer-events-auto">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>{partner.display_name}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-xs font-normal text-neutral-300 tabular-nums">
                      Age {partner.age}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-xs font-medium text-blue-400 tabular-nums">
                      Trust {partner.trust_score}%
                    </span>
                  </div>
                  {sharedInterests.length > 0 && (
                    <p className="mt-0.5 text-xs text-neutral-300">
                      Shared interests: {sharedInterests.join(' · ')}
                    </p>
                  )}
                </div>

                {/* Speed Round Countdown Timer */}
                {speedTimer !== null && (
                  <div className="rounded-lg bg-black/80 backdrop-blur-md border border-blue-500/40 px-3.5 py-2 font-mono text-sm font-semibold text-blue-400 tabular-nums">
                    Speed Round: {speedTimer}s
                  </div>
                )}
              </div>
            )}

            {/* Dismissable AI Icebreaker Banner */}
            <AnimatePresence>
              {icebreaker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-20 left-3 right-3 mx-auto max-w-lg rounded-lg border border-neutral-200 dark:border-white/15 bg-white/95 dark:bg-[#0E0A1C]/90 backdrop-blur-md p-3.5 flex items-start justify-between gap-3 shadow-md"
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        Icebreaker prompt
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                        {icebreaker}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIcebreaker(null)}
                    aria-label="Dismiss icebreaker"
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom-Left Local Video Preview */}
            <div
              className={`absolute bottom-3 left-3 w-36 sm:w-44 aspect-video overflow-hidden rounded-lg border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-[#0E0A1C] shadow-lg ${
                callMode === 'video' ? 'block' : 'hidden'
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${camEnabled ? 'block' : 'hidden'}`}
              />
              {!camEnabled && (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                  Camera off
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                You
              </span>
            </div>
          </div>

          {/* Control Bar */}
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] px-4 py-3 flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMic}
                aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  micEnabled
                    ? 'border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-white/5 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10'
                    : 'border-red-500/40 bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-200'
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{micEnabled ? 'Mic on' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleCam}
                aria-label={camEnabled ? 'Turn camera off' : 'Turn camera on'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  camEnabled
                    ? 'border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-white/5 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10'
                    : 'border-red-500/40 bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-200'
                }`}
              >
                {camEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{camEnabled ? 'Camera' : 'Cam off'}</span>
              </button>

              <button
                type="button"
                onClick={handleRequestIcebreaker}
                disabled={icebreakerLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{icebreakerLoading ? 'Thinking…' : 'Icebreaker'}</span>
              </button>

              {mode === 'make_a_friend' && isInActiveSession && (
                <button
                  type="button"
                  disabled={friendSent}
                  onClick={() => {
                    if (friendReceived) {
                      // We received a request — accept it
                      socketRef.current?.emit('friend-accept');
                      setFriendSent(true);
                      setFriendReceived(false);
                    } else {
                      // Send a new request
                      socketRef.current?.emit('friend-request');
                      setFriendSent(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-50 dark:bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-600/30 disabled:opacity-60 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{friendSent ? 'Friends ✓' : friendReceived ? 'Accept friend' : 'Add friend'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                <span>Next</span>
              </button>

              <button
                type="button"
                onClick={() => setReportOpen(true)}
                disabled={!partner && !lastPartner}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="hidden sm:inline">Report</span>
              </button>

              <button
                type="button"
                onClick={handleBlockPartner}
                disabled={!isInActiveSession}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                <Ban className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="hidden sm:inline">Block</span>
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                disabled={chatState === 'idle' || chatState === 'disconnected'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Chat Sidebar */}
        <aside className="lg:col-span-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#17151D] flex flex-col h-[480px] lg:h-full transition-colors">
          <div className="border-b border-neutral-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-500" />
              <h2 className="font-display text-sm font-semibold text-neutral-950 dark:text-white">
                Conversation
              </h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {autoTranslate ? `Translating to ${language.toUpperCase()}` : 'Original text'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 dark:text-neutral-400 px-4">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  When matched, messages appear here with optional real-time translation.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <motion.p
                        key={msg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.16 }}
                        className="text-center text-xs text-neutral-500 dark:text-neutral-400 py-1"
                      >
                        {msg.text}
                      </motion.p>
                    );
                  }
                  const isMe = msg.sender === 'me';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-white/10'
                        }`}
                      >
                        <p>{msg.translatedText || msg.text}</p>
                        {msg.translatedText && msg.translatedText !== msg.text && (
                          <p
                            className={`mt-1 pt-1 border-t text-[11px] ${
                              isMe
                                ? 'border-white/20 text-blue-100'
                                : 'border-neutral-200 dark:border-white/15 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            Original: {msg.text}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {partnerTyping && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                Partner is typing…
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Partner Rating after Disconnect */}
          {chatState === 'disconnected' && lastPartner && (
            <div className="border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-700 dark:text-neutral-300">
                Rate chat with {lastPartner.display_name}
              </span>
              {ratingSubmitted ? (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Thanks for rating
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRatePartner('up')}
                    aria-label="Thumbs up"
                    className="rounded-lg border border-neutral-300 dark:border-white/15 p-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600/15 hover:border-blue-500 cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatePartner('down')}
                    aria-label="Thumbs down"
                    className="rounded-lg border border-neutral-300 dark:border-white/15 p-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-red-600/15 hover:border-red-500 cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-neutral-200 dark:border-white/10 p-3 flex items-center gap-2"
          >
            <input
              type="text"
              disabled={!isInActiveSession}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder={isInActiveSession ? 'Type a message…' : 'Match to start messaging'}
              className="flex-1 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isInActiveSession || !draft.trim()}
              aria-label="Send message"
              className="rounded-lg bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </main>

      {/* Report Modal */}
      {reportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report user"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#17151D] p-6 text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Report safety issue</h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                aria-label="Close report modal"
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0A1C] px-3.5 py-2.5 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      checked={reportReason === r.id}
                      onChange={() => setReportReason(r.id)}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label htmlFor="report-details" className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Additional context (optional)
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#0E0A1C] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
              </div>
              {reportStatus && (
                <p className="text-xs text-blue-600 dark:text-blue-400">{reportStatus}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-lg border border-neutral-300 dark:border-white/15 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                >
                  Submit report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
