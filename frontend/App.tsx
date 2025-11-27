import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, GameState, Language, Topic, Question, PronunciationFeedback, LeaderboardEntry, GameMode, Opponent, Badge, HistoryEntry, AppMode, AppSettings, QuizSource } from './types';
import { generateQuestions, evaluatePronunciation, getPronunciationAudio } from './services/geminiService';
import { Card } from './components/Card';
import { 
  Trophy, 
  Clock, 
  Play, 
  User, 
  RotateCcw, 
  XCircle, 
  BookOpen, 
  LogOut,
  Timer,
  Mic,
  Star,
  Lock,
  Users,
  Swords,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRightCircle,
  Check,
  X,
  History,
  Calendar,
  Volume2,
  Loader2,
  Beer,
  Wine,
  Coffee,
  Store,
  Languages,
  Share2,
  Globe,
  Pencil,
  Save,
  Utensils,
  Medal,
  Crown,
  Martini,
  Settings,
  Palette,
  Database,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info,
  Layout,
  Server,
  Monitor,
  Plus,
  Book,
  MessageCircle,
  UserPlus,
  Scale
} from 'lucide-react';

// --- Configuration & Constants ---

const INITIAL_SOURCES: Record<string, QuizSource[]> = {
  [AppMode.IDIOMAS]: [
    { id: 'src_oxford', name: 'Oxford Dictionary API', type: 'API', enabled: true },
    { id: 'src_cambridge', name: 'Cambridge Hospitality Lexicon', type: 'Database', enabled: true },
    { id: 'src_manual_en', name: 'Manual Override (EN)', type: 'Manual', enabled: false },
  ],
  [AppMode.CERVEZA]: [
    { id: 'src_bjcp', name: 'BJCP Guidelines 2021', type: 'Database', enabled: true },
    { id: 'src_murcia_craft', name: 'Asoc. Cerveceros Murcia', type: 'API', enabled: true },
    { id: 'src_untappd', name: 'Untappd Trends', type: 'API', enabled: false },
  ],
  [AppMode.VINO]: [
    { id: 'src_parker', name: 'Robert Parker Ratings', type: 'Database', enabled: true },
    { id: 'src_do_spain', name: 'D.O. España Oficial', type: 'API', enabled: true },
  ],
  [AppMode.L43]: [
    { id: 'src_zamora', name: 'Zamora Company Archives', type: 'Manual', enabled: true },
    { id: 'src_cartagena', name: 'Cartagena History DB', type: 'Database', enabled: true },
  ],
  [AppMode.CULTURA]: [
    { id: 'src_repsol', name: 'Guía Repsol', type: 'API', enabled: true },
    { id: 'src_michelin', name: 'Michelin Guide Spain', type: 'API', enabled: true },
    { id: 'src_wiki_hist', name: 'Wikipedia (History)', type: 'API', enabled: false },
  ],
  [AppMode.LEGAL]: [
    { id: 'src_estatuto', name: 'Estatuto de los Trabajadores', type: 'Database', enabled: true },
    { id: 'src_convenio_murcia', name: 'Convenio Colectivo Hostelería Murcia', type: 'Database', enabled: true },
  ]
};

const INITIAL_PROFILE: UserProfile = {
  nickname: 'CamareroNovato',
  selectedAvatar: '🥚',
  totalCorrect: 0,
  totalTimeSeconds: 0,
  xp: 0,
  level: 1,
  badges: [],
  history: [],
  xpBreakdown: {},
  settings: {
    soundEnabled: true,
    backgroundColor: '#FAF8EE',
    buttonLayout: 'standard',
    cardBorderRadius: 24,
  },
  quizSources: INITIAL_SOURCES
};

const BACKGROUND_OPTIONS = [
  { color: '#FAF8EE', name: 'Crema Retro' },
  { color: '#FFFFFF', name: 'Blanco Puro' },
  { color: '#F0F4F8', name: 'Gris Frío' },
  { color: '#FFF5F5', name: 'Rosa Pálido' },
  { color: '#F0FFF4', name: 'Menta Suave' },
];

const BUTTON_LAYOUTS = [
  { id: 'standard', name: 'Estándar', icon: <Layout size={16} /> },
  { id: 'compact', name: 'Compacto', icon: <MinimizeLayoutIcon /> },
  { id: 'spread', name: 'Extendido', icon: <MaximizeLayoutIcon /> },
];

function MinimizeLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
    </svg>
  );
}

function MaximizeLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

const BADGES: Badge[] = [
  { id: 'b1', icon: '🥚', name: 'Aprendiz', description: 'Nivel 1: El comienzo', unlockedAtLevel: 1 },
  { id: 'b2', icon: '🥗', name: 'Ayudante', description: 'Nivel 3: Dominas lo básico', unlockedAtLevel: 3 },
  { id: 'b3', icon: '🍷', name: 'Sommelier', description: 'Nivel 5: Experto en bebidas', unlockedAtLevel: 5 },
  { id: 'b4', icon: '👨‍🍳', name: 'Chef', description: 'Nivel 10: Maestro de cocina', unlockedAtLevel: 10 },
  { id: 'b5', icon: '👑', name: 'Maître', description: 'Nivel 20: Leyenda del servicio', unlockedAtLevel: 20 },
];

const AVAILABLE_AVATARS = [
  { icon: '🥚', level: 1 },
  { icon: '☕', level: 1 },
  { icon: '🥐', level: 2 },
  { icon: '🥗', level: 3 },
  { icon: '🍺', level: 3 },
  { icon: '🍔', level: 4 },
  { icon: '🍷', level: 5 },
  { icon: '🍇', level: 5 },
  { icon: '🍹', level: 6 },
  { icon: '🧀', level: 7 },
  { icon: '🍕', level: 8 },
  { icon: '🔪', level: 9 },
  { icon: '👨‍🍳', level: 10 },
  { icon: '🥩', level: 10 },
  { icon: '🦞', level: 12 },
  { icon: '🥂', level: 15 },
  { icon: '💎', level: 18 },
  { icon: '👑', level: 20 },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { 
    nickname: 'PierreGagnaire', 
    xp: 12500, 
    level: 12,
    xpBreakdown: {
      [AppMode.IDIOMAS]: 2000,
      [AppMode.CERVEZA]: 500,
      [AppMode.VINO]: 8000,
      [AppMode.L43]: 1000,
      [AppMode.CULTURA]: 1000
    }
  },
  { 
    nickname: 'GordonR', 
    xp: 8400, 
    level: 8,
    xpBreakdown: {
      [AppMode.IDIOMAS]: 4000,
      [AppMode.CERVEZA]: 3000,
      [AppMode.VINO]: 1000,
      [AppMode.L43]: 200,
      [AppMode.CULTURA]: 200
    }
  },
  { 
    nickname: 'MassimoB', 
    xp: 6200, 
    level: 6,
    xpBreakdown: {
      [AppMode.IDIOMAS]: 1000,
      [AppMode.CERVEZA]: 1000,
      [AppMode.VINO]: 2000,
      [AppMode.L43]: 1000,
      [AppMode.CULTURA]: 1200
    }
  },
  { 
    nickname: 'JoanRoca', 
    xp: 4100, 
    level: 4,
    xpBreakdown: {
      [AppMode.IDIOMAS]: 500,
      [AppMode.CERVEZA]: 500,
      [AppMode.VINO]: 500,
      [AppMode.L43]: 500,
      [AppMode.CULTURA]: 2100
    }
  },
];

const OPPONENTS: Opponent[] = [
  { name: 'Becario', avatar: '😓', difficulty: 'easy', speed: 8000 },
  { name: 'Camarero', avatar: '😐', difficulty: 'medium', speed: 5000 },
  { name: 'Maître', avatar: '🧐', difficulty: 'hard', speed: 3000 },
];

const FRIEND_OPPONENT: Opponent = { name: 'Amigo', avatar: '👤', difficulty: 'medium', speed: 6000 };

const APPS_CONFIG = [
  { mode: AppMode.CULTURA, icon: <Store size={24} />, color: 'bg-[#81B29A]', desc: 'Historia de los bares' },
  { mode: AppMode.LEGAL, icon: <Scale size={24} />, color: 'bg-[#CBC0D3]', desc: 'Derechos, obligaciones y convenio' },
  { mode: AppMode.L43, icon: <Coffee size={24} />, color: 'bg-[#F4F1DE]', desc: 'Licor 43 y Café Asiático' },
  { mode: AppMode.CERVEZA, icon: <Beer size={24} />, color: 'bg-[#F2CC8F]', desc: 'Cultura cervecera y estilos' },
  { mode: AppMode.VINO, icon: <Wine size={24} />, color: 'bg-[#E07A5F]', desc: 'Enología, uvas y maridaje' },
  { mode: AppMode.IDIOMAS, icon: <Languages size={24} />, color: 'bg-[#98C1D9]', desc: 'Inglés y Francés para hostelería' },
];

const XP_PER_LEVEL = 500;
const XP_PER_CORRECT = 50;

// --- Audio Helper Functions ---
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000): AudioBuffer {
  // Ensure we have an even number of bytes for Int16
  const align = data.length % 2;
  const buffer = align === 0 ? data.buffer : data.buffer.slice(0, data.length - align);
  
  const pcm16 = new Int16Array(buffer);
  const frameCount = pcm16.length;
  const audioBuffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit integer to float range [-1.0, 1.0]
      channelData[i] = pcm16[i] / 32768.0;
  }
  
  return audioBuffer;
}

// --- Main Component ---

export default function App() {
  // Global State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.CULTURA);
  
  // Game Configuration State
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SOLO);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent>(OPPONENTS[0]);
  const [leaderboardTab, setLeaderboardTab] = useState<string>('GLOBAL'); // GLOBAL or AppMode

  // Challenge Friend State
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'counting' | 'connected' | 'expired'>('idle');
  const [challengeTimer, setChallengeTimer] = useState(30);

  // Active Game State
  const [deck, setDeck] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isModalExiting, setIsModalExiting] = useState(false); // New state for modal exit animation
  const [quizTimer, setQuizTimer] = useState(0); 
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0); 
  const [opponentLastScoreTime, setOpponentLastScoreTime] = useState(0); // For animating opponent score
  const [answeredState, setAnsweredState] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Card Action State (for buttons)
  const [cardAction, setCardAction] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  // Pronunciation State
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationFeedback | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Admin / Quiz Edit State
  const [editingQuizMode, setEditingQuizMode] = useState<AppMode | null>(null);
  const [newSourceInput, setNewSourceInput] = useState('');

  // Intro Logic
  useEffect(() => {
    if (gameState === GameState.INTRO) {
      const timer = setTimeout(() => {
        setGameState(GameState.PROFILE);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Load profile
  useEffect(() => {
    const saved = localStorage.getItem('gastroPolyglotProfile_v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrations
      if (!parsed.history) parsed.history = [];
      if (!parsed.xpBreakdown) parsed.xpBreakdown = {};
      if (!parsed.selectedAvatar) parsed.selectedAvatar = '🥚';
      if (!parsed.settings) parsed.settings = INITIAL_PROFILE.settings;
      if (!parsed.quizSources) parsed.quizSources = INITIAL_SOURCES;
      
      setProfile(parsed);
    }
  }, []);

  // Save profile & Level Up/Badge Logic
  useEffect(() => {
    const newBadges = [...profile.badges];
    let badgeAdded = false;
    BADGES.forEach(badge => {
      if (profile.level >= badge.unlockedAtLevel && !newBadges.includes(badge.id)) {
        newBadges.push(badge.id);
        badgeAdded = true;
      }
    });

    if (badgeAdded) {
      setProfile(prev => ({ ...prev, badges: newBadges }));
    }

    localStorage.setItem('gastroPolyglotProfile_v4', JSON.stringify(profile));
  }, [profile]);


  // --- Multiplayer Simulation ---
  useEffect(() => {
    let opponentInterval: number;

    if (gameState === GameState.PLAYING && gameMode === GameMode.DUEL) {
      opponentInterval = window.setInterval(() => {
        const hitChance = selectedOpponent.difficulty === 'easy' ? 0.6 : selectedOpponent.difficulty === 'medium' ? 0.8 : 0.95;
        if (Math.random() < hitChance) {
          setOpponentScore(prev => prev + 1);
          setOpponentLastScoreTime(Date.now()); // Trigger animation
        }
      }, selectedOpponent.speed);
    }

    return () => clearInterval(opponentInterval);
  }, [gameState, gameMode, selectedOpponent]);

  // Challenge Friend Timer Logic
  useEffect(() => {
    let interval: number;
    if (challengeStatus === 'counting') {
        interval = window.setInterval(() => {
            setChallengeTimer(prev => {
                if (prev <= 1) {
                    setChallengeStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [challengeStatus]);

  // --- Helpers ---

  const calculateLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

  const isTopicLocked = (topic: Topic) => {
    if (topic === Topic.SERVICE) return profile.level < 3;
    if (topic === Topic.UTENSILS) return profile.level < 5;
    return false;
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Fácil': return 'bg-[#81B29A] text-[#1F2937]';
      case 'Medio': return 'bg-[#F2CC8F] text-[#1F2937]';
      case 'Difícil': return 'bg-[#E07A5F] text-[#FFFBF0]';
      default: return 'bg-[#98C1D9] text-[#1F2937]';
    }
  };

  const playPronunciation = async (text: string) => {
    if (!profile.settings.soundEnabled) {
      alert("El sonido está desactivado en ajustes.");
      return;
    }
    if (!selectedLanguage || isPlayingAudio || appMode !== AppMode.IDIOMAS) return;
    
    setIsPlayingAudio(true);
    
    try {
      const audioBase64 = await getPronunciationAudio(text, selectedLanguage);
      
      if (audioBase64) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const pcmBytes = base64ToUint8Array(audioBase64);
        
        // Manual decoding of PCM data instead of decodeAudioData
        const audioBuffer = pcmToAudioBuffer(pcmBytes, audioContext);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          setIsPlayingAudio(false);
          audioContext.close();
        };
        
        source.start(0);
      } else {
        alert("No se pudo generar el audio.");
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
    }
  };

  const openEditProfile = () => {
    setEditName(profile.nickname);
    setEditAvatar(profile.selectedAvatar);
    setIsEditingProfile(true);
  };

  const saveProfileChanges = () => {
    if (editName.trim().length === 0) return;
    setProfile(prev => ({
      ...prev,
      nickname: editName.substring(0, 15),
      selectedAvatar: editAvatar
    }));
    setIsEditingProfile(false);
  };

  const toggleSetting = (setting: keyof AppSettings) => {
      // For boolean settings
      if (setting === 'soundEnabled') {
          setProfile(prev => ({
              ...prev,
              settings: {
                  ...prev.settings,
                  [setting]: !prev.settings[setting]
              }
          }));
      }
  };

  const updateSetting = (setting: keyof AppSettings, value: any) => {
    setProfile(prev => ({
        ...prev,
        settings: {
            ...prev.settings,
            [setting]: value
        }
    }));
  };

  const toggleSource = (mode: string, sourceId: string) => {
    setProfile(prev => {
        const currentSources = prev.quizSources[mode] || [];
        const updatedSources = currentSources.map(src => 
            src.id === sourceId ? { ...src, enabled: !src.enabled } : src
        );
        return {
            ...prev,
            quizSources: {
                ...prev.quizSources,
                [mode]: updatedSources
            }
        };
    });
  };

  const handleAddSource = () => {
      if (!editingQuizMode || !newSourceInput.trim()) return;
      
      const newSource: QuizSource = {
          id: `src_manual_${Date.now()}`,
          name: newSourceInput.trim(),
          type: 'Manual',
          enabled: true
      };

      setProfile(prev => {
          const currentSources = prev.quizSources[editingQuizMode] || [];
          return {
              ...prev,
              quizSources: {
                  ...prev.quizSources,
                  [editingQuizMode]: [...currentSources, newSource]
              }
          };
      });
      setNewSourceInput('');
  };

  const resetQuizStats = (mode: AppMode) => {
    if (confirm(`¿Resetear estadísticas solo de ${mode}?`)) {
        setProfile(prev => {
            const currentXp = prev.xpBreakdown[mode] || 0;
            // Remove quiz XP from total
            const newTotalXp = Math.max(0, prev.xp - currentXp);
            // Clear history for this mode
            const newHistory = prev.history.filter(h => h.mode !== mode);
            
            const newXpBreakdown = { ...prev.xpBreakdown };
            delete newXpBreakdown[mode];

            return {
                ...prev,
                xp: newTotalXp,
                level: calculateLevel(newTotalXp),
                history: newHistory,
                xpBreakdown: newXpBreakdown
            };
        });
        setEditingQuizMode(null);
    }
  };

  const resetProfile = () => {
      if (confirm("¿Estás seguro de que quieres borrar tu progreso TOTAL? Esta acción no se puede deshacer.")) {
          setProfile(INITIAL_PROFILE);
          localStorage.removeItem('gastroPolyglotProfile_v4');
          setGameState(GameState.PROFILE);
      }
  };

  const handleShare = async () => {
    const shareData = {
        title: 'CdB_ Quizz',
        text: `¡He conseguido ${sessionScore} aciertos y he ganado ${sessionScore * XP_PER_CORRECT} XP en CdB_ Quizz! 🍻`,
        url: window.location.href, 
    };

    if (navigator.share && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log("Error sharing", err);
        }
    } else {
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Resultado copiado al portapapeles");
    }
  };

  const startChallenge = () => {
      setChallengeStatus('counting');
      setChallengeTimer(30);
  };

  const sendChallengeWhatsApp = () => {
      const text = `¡Te reto a un duelo de conocimiento hostelero en CdB_ Quizz! ¿Te atreves?`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');

      // Simulate connection for demo purposes
      setTimeout(() => {
          setChallengeStatus('connected');
          setSelectedOpponent(FRIEND_OPPONENT);
      }, 3000);
  };

  // --- Handlers ---

  const handleStartGame = async () => {
    // Validation based on mode
    if (appMode === AppMode.IDIOMAS && (!selectedLanguage || !selectedTopic)) return;
    
    setGameState(GameState.LOADING);

    // Get enabled sources for this mode
    const enabledSources = profile.quizSources[appMode]
        ?.filter(src => src.enabled)
        .map(src => src.name) || [];

    const { questions, usedSources } = await generateQuestions(appMode, selectedLanguage, selectedTopic, enabledSources);
    
    // Dynamic Source Update: If Gemini used new sources, add them to the profile
    if (usedSources && usedSources.length > 0) {
        setProfile(prev => {
            const currentSources = prev.quizSources[appMode] || [];
            const existingNames = new Set(currentSources.map(s => s.name.toLowerCase()));
            const newSourcesToAdd: QuizSource[] = [];

            usedSources.forEach(srcName => {
                if (!existingNames.has(srcName.toLowerCase())) {
                    newSourcesToAdd.push({
                        id: `src_ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: srcName,
                        type: 'API', // Sources found by AI are API/External
                        enabled: true
                    });
                }
            });

            if (newSourcesToAdd.length === 0) return prev;

            return {
                ...prev,
                quizSources: {
                    ...prev.quizSources,
                    [appMode]: [...currentSources, ...newSourcesToAdd]
                }
            };
        });
    }

    setDeck(questions);
    setCurrentQuestionIndex(0);
    setSessionScore(0);
    setOpponentScore(0);
    setGameState(GameState.PLAYING);
  };

  const triggerCardAction = (direction: 'left' | 'right' | 'up' | 'down') => {
    setCardAction(direction);
  };

  const advanceCard = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleContinue = () => {
    // 1. Start exit animation for modal (slides up to top)
    setIsModalExiting(true);
    
    // 2. We want the transition to be fluid. 
    // The "card" underneath should effectively "fly away" or switch 
    // at the same time the modal leaves to show progress.
    
    setTimeout(() => {
        // Reset states
        setIsAnswering(false);
        setIsModalExiting(false);
        setAnsweredState(null);
        setSelectedAnswer(null);
        setPronunciationResult(null);
        setIsAnalyzing(false);
        setQuizTimer(0);
        
        // Advance card immediately after visual transition
        advanceCard();
    }, 400); // Wait for slide-out animation
  };

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    setCardAction(null);

    // If answering, swipes shouldn't close it instantly anymore, user must click continue
    if (isAnswering) return;

    const currentQ = deck[currentQuestionIndex];
    
    if (direction === 'up') {
      setIsAnswering(true);
      setPronunciationResult(null); 
      setIsAnalyzing(false);
      setQuizTimer(0);
      setAnsweredState(null);
      setSelectedAnswer(null);
      const interval = window.setInterval(() => {
        setQuizTimer(prev => prev + 1); 
      }, 100);
      setTimerInterval(interval);
    } else if (direction === 'right') {
      advanceCard();
    } else if (direction === 'left') {
      setDeck(prev => [...prev, currentQ]); 
      advanceCard();
    } else if (direction === 'down') {
      setDeck(prev => [...prev, currentQ]); 
      advanceCard();
    }
  }, [deck, currentQuestionIndex, isAnswering]);

  const handleAnswer = (selectedOption: string) => {
    if (timerInterval) clearInterval(timerInterval);
    const currentQ = deck[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    
    setSelectedAnswer(selectedOption);

    const timeSpent = quizTimer / 10;
    if (isCorrect) setSessionScore(prev => prev + 1);

    const newHistoryEntry: HistoryEntry = {
      questionId: currentQ.id,
      questionText: currentQ.questionText,
      selectedAnswer: selectedOption,
      correctAnswer: currentQ.correctAnswer,
      isCorrect: isCorrect,
      timestamp: Date.now(),
      mode: appMode
    };

    setProfile(prev => {
      const xpGained = isCorrect ? XP_PER_CORRECT : 5;
      const newXp = prev.xp + xpGained; 
      
      // Update specific mode XP
      const currentModeXp = prev.xpBreakdown?.[appMode] || 0;
      const newXpBreakdown = { ...prev.xpBreakdown, [appMode]: currentModeXp + xpGained };

      // Ensure history is initialized if undefined in legacy state
      const currentHistory = prev.history || [];

      return {
        ...prev,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalTimeSeconds: prev.totalTimeSeconds + timeSpent,
        xp: newXp,
        level: calculateLevel(newXp),
        history: [newHistoryEntry, ...currentHistory].slice(0, 100), // Keep last 100
        xpBreakdown: newXpBreakdown
      };
    });

    setAnsweredState(isCorrect ? 'correct' : 'incorrect');
  };

  const endGame = () => {
    setGameState(GameState.RESULTS);
  };

  // Pronunciation
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsAnalyzing(true); // Start analysis UI
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          const activeQuestion = deck[currentQuestionIndex];
          if (activeQuestion && selectedLanguage) {
             const result = await evaluatePronunciation(base64String, activeQuestion.correctAnswer, selectedLanguage);
             setPronunciationResult(result);
             setIsAnalyzing(false); // Stop analysis UI
             
             if (result.score > 80) {
                setProfile(prev => {
                    const bonus = 20;
                    const currentModeXp = prev.xpBreakdown?.[appMode] || 0;
                    return { 
                        ...prev, 
                        xp: prev.xp + bonus,
                        xpBreakdown: { ...prev.xpBreakdown, [appMode]: currentModeXp + bonus }
                    };
                });
             }
          } else {
             setIsAnalyzing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsAnalyzing(false);
      setPronunciationResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono.");
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // State updates handled in onstop event
    }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && deck.length > 0 && currentQuestionIndex >= deck.length) {
      endGame();
    }
  }, [currentQuestionIndex, gameState, deck.length]);

  // --- Dynamic Style Wrapper ---
  const appStyle = {
      backgroundColor: profile.settings.backgroundColor,
  };

  // --- Views ---

  // 0. INTRO VIEW
  if (gameState === GameState.INTRO) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500" style={appStyle}>
        {/* Animated Icons Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           {/* Decorative elements */}
        </div>

        <div className="flex gap-4 mb-8">
           {APPS_CONFIG.map((app, i) => (
             <div 
               key={app.mode} 
               className={`w-12 h-12 rounded-full ${app.color} border-2-charcoal flex items-center justify-center text-[#1F2937] animate-pop shadow-retro-sm`}
               style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
             >
                {app.icon}
             </div>
           ))}
        </div>

        <h1 className="text-5xl font-bold tracking-tighter text-[#1F2937] mb-2 animate-slide-up text-outline" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
           CdB_ Quizz
        </h1>
        <p className="text-[#3D405B] font-bold uppercase tracking-widest text-sm animate-slide-up" style={{ animationDelay: '1000ms', animationFillMode: 'both' }}>
           Cultura de Bar
        </p>

        <div className="w-48 h-2 bg-[#1F2937]/10 rounded-full mt-10 overflow-hidden">
           <div className="h-full bg-[#E07A5F] animate-[shake-horizontal_4s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
        </div>
      </div>
    );
  }

  // 1. PROFILE VIEW
  if (gameState === GameState.PROFILE) {
    const progressToNextLevel = (profile.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
    const currentBadge = BADGES.slice().reverse().find(b => profile.level >= b.unlockedAtLevel) || BADGES[0];

    return (
      <div className="min-h-screen flex flex-col items-center p-6 text-[#1F2937] transition-colors duration-500" style={appStyle}>
        <header className="w-full max-w-md flex justify-between items-center mb-8 mt-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-12 h-12 bg-[#F2CC8F] rounded-full flex items-center justify-center text-[#1F2937] border-2-charcoal shadow-retro-sm hover:scale-110 transition-transform active:scale-95 group"
            >
               <BookOpen size={22} strokeWidth={2.5} className="group-hover:-rotate-6 transition-transform" />
            </button>
            <div className="font-bold text-lg tracking-tight text-[#1F2937] bg-white px-4 py-2 rounded-full border-2-charcoal shadow-sm flex items-baseline gap-1">
                <span className="text-sm opacity-60">CdB_</span>
                <span>{appMode.replace('CdB_ ', '')}</span>
            </div>
          </div>
          <button 
            onClick={() => setGameState(GameState.LEADERBOARD)} 
            className="w-12 h-12 bg-[#98C1D9] rounded-full flex items-center justify-center text-[#1F2937] border-2-charcoal shadow-retro-sm hover:scale-110 transition-transform active:scale-95 group"
          >
            <Trophy size={22} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
          </button>
        </header>

        <div className="bg-[#FFFBF0] rounded-[24px] p-8 w-full max-w-md text-center mb-8 relative border-2-charcoal shadow-retro animate-pop duration-500">
          <div className="relative inline-block group">
            <button 
                onClick={openEditProfile}
                className="w-24 h-24 bg-[#F2CC8F] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-2-charcoal shadow-sm transition-transform hover:scale-105 active:scale-95 relative overflow-hidden"
            >
              {profile.selectedAvatar}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Pencil size={24} className="text-[#1F2937]" />
              </div>
            </button>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#81B29A] text-[#1F2937] border-2-charcoal px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-widest whitespace-nowrap z-10">
               Nivel {profile.level}
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1 text-[#1F2937] mt-5">{profile.nickname}</h2>
          <p className="text-[#3D405B] text-xs font-bold uppercase tracking-wider mb-6">{currentBadge.name}</p>

          <div className="w-full bg-white rounded-full h-3 mb-2 overflow-hidden border-2-charcoal">
            <div className="bg-[#E07A5F] h-full transition-all duration-1000 ease-out border-r-2 border-[#1F2937]" style={{ width: `${progressToNextLevel}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-[#3D405B] font-bold font-mono mb-6">
            <span>{profile.xp % XP_PER_LEVEL} XP</span>
            <span>{XP_PER_LEVEL} XP</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setGameState(GameState.HISTORY)}
              className="bg-[#F4F1DE] p-3 rounded-xl border-2-charcoal hover:shadow-retro-sm active:translate-y-[1px] active:shadow-retro-none transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-2 text-[#1F2937] mb-1 group-hover:scale-110 transition-transform">
                <Trophy size={16} />
              </div>
              <div className="text-xl font-bold tracking-tight text-[#1F2937]">{profile.totalCorrect}</div>
              <div className="text-[9px] text-[#3D405B] uppercase tracking-wide font-bold">Aciertos</div>
            </button>
            <div className="bg-[#F4F1DE] p-3 rounded-xl border-2-charcoal">
              <div className="flex items-center justify-center gap-2 text-[#1F2937] mb-1">
                <Clock size={16} />
              </div>
              <div className="text-xl font-bold tracking-tight text-[#1F2937]">{formatTime(profile.totalTimeSeconds)}</div>
              <div className="text-[9px] text-[#3D405B] uppercase tracking-wide font-bold">Jugado</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setGameState(GameState.SETUP)}
          className="w-full max-w-md bg-[#98C1D9] hover:bg-[#88aec9] active:translate-y-[2px] active:shadow-none transition-all text-[#1F2937] font-bold py-4 rounded-xl shadow-retro flex items-center justify-center gap-2 text-lg border-2-charcoal animate-slide-up"
        >
          <Play fill="currentColor" size={20} />
          <span className="font-bold tracking-widest">JUGAR AHORA</span>
        </button>

        <div className="w-full max-w-md mt-4 flex justify-between items-center animate-slide-up" style={{ animationDelay: '100ms' }}>
             <button
                onClick={() => setGameState(GameState.ADMIN_MENU)}
                className="w-10 h-10 rounded-full bg-white border-2-charcoal text-[#3D405B] flex items-center justify-center shadow-sm hover:rotate-90 transition-transform active:scale-95"
             >
                <Settings size={20} strokeWidth={2.5} />
             </button>
             <div className="text-[10px] font-bold text-[#3D405B] opacity-50 font-mono">v1.1.0 (Admin)</div>
        </div>

        {/* EDIT PROFILE MODAL */}
        {isEditingProfile && (
            <div className="fixed inset-0 z-50 bg-[#1F2937]/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FAF8EE] rounded-[24px] p-6 w-full max-w-sm border-2-charcoal shadow-2xl animate-pop">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#1F2937]">Editar Perfil</h3>
                        <button onClick={() => setIsEditingProfile(false)} className="bg-[#E07A5F] p-1.5 rounded-lg border-2-charcoal text-[#FFFBF0]">
                            <X size={16} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-2">Tu Nickname</label>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={15}
                            className="w-full p-3 rounded-xl border-2-charcoal bg-white font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#98C1D9]"
                            placeholder="Nombre..."
                        />
                    </div>

                    <div className="mb-6">
                         <label className="block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-2">Elige tu Avatar</label>
                         <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                             {AVAILABLE_AVATARS.map((item, idx) => {
                                 const isUnlocked = profile.level >= item.level;
                                 const isSelected = editAvatar === item.icon;
                                 
                                 return (
                                     <button
                                         key={idx}
                                         disabled={!isUnlocked}
                                         onClick={() => setEditAvatar(item.icon)}
                                         className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xl transition-all relative ${
                                             isSelected 
                                                ? 'bg-[#F2CC8F] border-[#1F2937] shadow-sm scale-110' 
                                                : isUnlocked 
                                                    ? 'bg-white border-[#1F2937]/20 hover:bg-[#F4F1DE]' 
                                                    : 'bg-[#EDF2F7] border-transparent opacity-50 cursor-not-allowed'
                                         }`}
                                     >
                                         {isUnlocked ? item.icon : <Lock size={12} className="text-[#3D405B]" />}
                                         {!isUnlocked && (
                                             <div className="absolute -bottom-1.5 right-0 bg-[#3D405B] text-white text-[8px] px-1 rounded-full font-bold">
                                                 Lv{item.level}
                                             </div>
                                         )}
                                     </button>
                                 )
                             })}
                         </div>
                    </div>

                    <button 
                        onClick={saveProfileChanges}
                        className="w-full bg-[#81B29A] text-[#1F2937] font-bold py-3 rounded-xl border-2-charcoal shadow-retro-sm active:translate-y-[1px] active:shadow-retro-none transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        GUARDAR CAMBIOS
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // 1.5 ADMIN MENU
  if (gameState === GameState.ADMIN_MENU) {
    return (
        <div className="min-h-screen flex flex-col items-center p-6 text-[#1F2937] transition-colors duration-500" style={appStyle}>
            <header className="w-full max-w-md flex items-center mb-8 mt-4 animate-in slide-in-from-left duration-500">
                <button onClick={() => setGameState(GameState.PROFILE)} className="mr-4 w-12 h-12 flex items-center justify-center bg-white border-2-charcoal rounded-full shadow-retro-sm hover:scale-105 transition-transform">
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="font-bold text-2xl tracking-tight text-[#1F2937]">Administración</h1>
            </header>

            <div className="w-full max-w-md space-y-6 overflow-y-auto no-scrollbar pb-8">
                
                {/* General Settings */}
                <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                    <div className="flex items-center gap-2 mb-3 text-[#3D405B] font-bold uppercase tracking-wider text-xs px-2">
                         <Settings size={14} /> General
                    </div>
                    <div className="bg-white rounded-2xl border-2-charcoal shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">Efectos de Sonido</span>
                            <button onClick={() => toggleSetting('soundEnabled')} className={`${profile.settings.soundEnabled ? 'text-[#81B29A]' : 'text-gray-300'}`}>
                                {profile.settings.soundEnabled ? <ToggleRight size={32} fill="#1F2937" /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Design Section */}
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-2 mb-3 text-[#3D405B] font-bold uppercase tracking-wider text-xs px-2">
                        <Palette size={14} /> Diseño e Interfaz
                    </div>
                    <div className="bg-white rounded-2xl border-2-charcoal shadow-sm p-4 space-y-5">
                        
                        {/* Background Color Picker */}
                        <div>
                            <span className="font-bold text-xs uppercase text-[#3D405B] mb-2 block">Color de Fondo</span>
                            <div className="flex gap-2 justify-between">
                                {BACKGROUND_OPTIONS.map((bg) => (
                                    <button
                                        key={bg.color}
                                        onClick={() => updateSetting('backgroundColor', bg.color)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${profile.settings.backgroundColor === bg.color ? 'border-[#1F2937] ring-2 ring-[#81B29A] ring-offset-2 scale-110' : 'border-gray-200'}`}
                                        style={{ backgroundColor: bg.color }}
                                        title={bg.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Button Layout Selector */}
                        <div>
                             <span className="font-bold text-xs uppercase text-[#3D405B] mb-2 block">Distribución de Botones</span>
                             <div className="grid grid-cols-3 gap-2">
                                 {BUTTON_LAYOUTS.map((layout) => (
                                     <button
                                        key={layout.id}
                                        onClick={() => updateSetting('buttonLayout', layout.id)}
                                        className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                            profile.settings.buttonLayout === layout.id 
                                                ? 'bg-[#F2CC8F] border-[#1F2937] text-[#1F2937]' 
                                                : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                                        }`}
                                     >
                                         {layout.icon}
                                         <span className="text-[10px] font-bold">{layout.name}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>

                    </div>
                </div>

                {/* Quizz Management Section */}
                <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                     <div className="flex items-center gap-2 mb-3 text-[#3D405B] font-bold uppercase tracking-wider text-xs px-2">
                        <Database size={14} /> Gestión de Quizz
                    </div>
                    <div className="bg-white rounded-2xl border-2-charcoal shadow-sm overflow-hidden">
                        {APPS_CONFIG.map((app, i) => (
                            <div key={app.mode} className={`p-4 flex items-center justify-between ${i !== APPS_CONFIG.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full ${app.color} flex items-center justify-center text-[#1F2937] border-2-charcoal text-xs`}>
                                        {app.icon}
                                    </div>
                                    <span className="font-bold text-sm">{app.mode.replace('CdB_ ', '')}</span>
                                </div>
                                <button 
                                  onClick={() => setEditingQuizMode(app.mode)}
                                  className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-500 hover:bg-[#F2CC8F] hover:text-[#1F2937] transition-colors"
                                >
                                    Editar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Zone */}
                <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center gap-2 mb-3 text-[#E07A5F] font-bold uppercase tracking-wider text-xs px-2">
                        <AlertCircle size={14} /> Zona de Peligro
                    </div>
                    <button 
                        onClick={resetProfile}
                        className="w-full bg-[#FFE5E5] text-[#E07A5F] p-4 rounded-2xl border-2 border-[#E07A5F] font-bold flex items-center justify-center gap-2 hover:bg-[#E07A5F] hover:text-white transition-colors"
                    >
                        <Trash2 size={18} />
                        RESETEAR PERFIL Y DATOS
                    </button>
                </div>
            </div>

            {/* Quiz Management Modal */}
            {editingQuizMode && (
              <div className="fixed inset-0 z-50 bg-[#1F2937]/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="bg-[#FAF8EE] rounded-[24px] p-6 w-full max-w-sm border-2-charcoal shadow-2xl animate-pop max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#1F2937]">
                            {editingQuizMode.replace('CdB_ ', '')}
                        </h3>
                        <button onClick={() => setEditingQuizMode(null)} className="bg-[#E07A5F] p-1.5 rounded-lg border-2-charcoal text-[#FFFBF0]">
                            <X size={16} strokeWidth={3} />
                        </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border-2-charcoal mb-6">
                        <div className="text-xs font-bold text-[#3D405B] uppercase tracking-wider mb-2">Estadísticas</div>
                        <div className="flex justify-between mb-2">
                           <span className="text-sm font-bold">XP Acumulada:</span>
                           <span className="text-sm font-mono">{profile.xpBreakdown[editingQuizMode] || 0} XP</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold">Preguntas:</span>
                           <span className="text-sm font-mono">{profile.history.filter(h => h.mode === editingQuizMode).length}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#3D405B] uppercase tracking-wider mb-3">
                            <Server size={12} /> Fuentes de Datos (IA Context)
                        </div>
                        <div className="space-y-2 mb-4">
                            {profile.quizSources[editingQuizMode]?.map((source) => (
                                <div key={source.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                                    <div className="flex flex-col flex-1 mr-2 overflow-hidden">
                                        <span className={`font-bold text-xs truncate ${source.enabled ? 'text-[#1F2937]' : 'text-gray-400'}`}>{source.name}</span>
                                        <span className="text-[9px] text-[#3D405B] opacity-60 font-bold">{source.type}</span>
                                    </div>
                                    <button 
                                        onClick={() => toggleSource(editingQuizMode, source.id)}
                                        className={`${source.enabled ? 'text-[#81B29A]' : 'text-gray-300'}`}
                                    >
                                        {source.enabled ? <ToggleRight size={28} fill="#1F2937" /> : <ToggleLeft size={28} />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Source Input */}
                        <div className="flex gap-2">
                             <input 
                               type="text" 
                               value={newSourceInput}
                               onChange={(e) => setNewSourceInput(e.target.value)}
                               placeholder="Añadir fuente manual..."
                               className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F2CC8F]"
                             />
                             <button 
                               onClick={handleAddSource}
                               disabled={!newSourceInput.trim()}
                               className="bg-[#1F2937] text-[#FFFBF0] rounded-xl px-3 flex items-center justify-center hover:bg-[#81B29A] disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                             >
                                <Plus size={16} />
                             </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => resetQuizStats(editingQuizMode)}
                        className="w-full bg-[#F2CC8F] text-[#1F2937] p-3 rounded-xl border-2-charcoal font-bold flex items-center justify-center gap-2 hover:bg-[#E07A5F] hover:text-white transition-colors shadow-sm active:translate-y-1"
                    >
                        <RotateCcw size={18} />
                        Resetear Progreso
                    </button>
                 </div>
              </div>
            )}
        </div>
    );
  }

  // 2. MAIN MENU (APP SELECTION)
  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen flex flex-col items-center p-6 text-[#1F2937] transition-colors duration-500" style={appStyle}>
         <header className="w-full max-w-md flex items-center mb-8 mt-4 animate-in slide-in-from-left duration-500">
            <button onClick={() => setGameState(GameState.PROFILE)} className="mr-4 w-12 h-12 flex items-center justify-center bg-white border-2-charcoal rounded-full shadow-retro-sm hover:scale-105 transition-transform">
               <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h1 className="font-bold text-2xl tracking-tight text-[#1F2937]">Selecciona Quizz</h1>
         </header>

         <div className="w-full max-w-md grid grid-cols-1 gap-4">
            {APPS_CONFIG.map((app, index) => (
              <button
                key={app.mode}
                onClick={() => {
                  setAppMode(app.mode);
                  setGameState(GameState.PROFILE);
                }}
                className={`w-full p-4 rounded-[20px] border-2-charcoal text-left transition-all active:scale-[0.98] flex items-center gap-4 animate-slide-up ${appMode === app.mode ? 'shadow-retro ring-2 ring-offset-2 ring-[#1F2937]' : 'shadow-sm bg-white hover:shadow-retro-sm hover:-translate-y-1'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                 <div className={`w-14 h-14 rounded-full border-2-charcoal text-[#1F2937] ${app.color} flex items-center justify-center shrink-0`}>
                    {app.icon}
                 </div>
                 <div>
                    <h3 className="font-bold text-lg leading-tight">{app.mode.replace('CdB_ ', '')}</h3>
                    <p className="text-xs text-[#3D405B] font-bold opacity-70 mt-1">{app.desc}</p>
                 </div>
                 {appMode === app.mode && (
                   <div className="ml-auto text-[#81B29A]">
                      <CheckCircle2 size={24} fill="#1F2937" className="text-[#81B29A]" />
                   </div>
                 )}
              </button>
            ))}

            <button
                disabled
                className="w-full p-4 rounded-[20px] border-2-charcoal text-left flex items-center gap-4 shadow-sm bg-[#EDF2F7] opacity-70 cursor-not-allowed relative group overflow-hidden animate-slide-up"
                style={{ animationDelay: `${APPS_CONFIG.length * 100}ms` }}
            >
                <div className="w-14 h-14 rounded-full border-2-charcoal text-[#1F2937] bg-white flex items-center justify-center shrink-0 grayscale">
                    <Martini size={24} strokeWidth={2} />
                </div>
                <div className="grayscale opacity-50">
                    <h3 className="font-bold text-lg leading-tight">Coctelería</h3>
                    <p className="text-xs text-[#3D405B] font-bold opacity-70 mt-1">Próximamente</p>
                </div>
                <div className="ml-auto text-[#3D405B] opacity-50">
                    <Lock size={24} strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 bg-[#1F2937]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-[#1F2937] text-[#FFFBF0] text-xs font-bold px-3 py-1.5 rounded-full shadow-retro-sm transform scale-90 group-hover:scale-100 transition-transform">
                        Próximamente
                    </div>
                </div>
            </button>
         </div>
      </div>
    );
  }

  // 3. SETUP VIEW
  if (gameState === GameState.SETUP) {
    const isIdiomas = appMode === AppMode.IDIOMAS;

    return (
      <div className="min-h-screen p-6 flex flex-col max-w-md mx-auto text-[#1F2937] transition-colors duration-500" style={appStyle}>
        <button onClick={() => setGameState(GameState.PROFILE)} className="mb-6 text-[#1F2937] hover:opacity-70 self-start flex items-center gap-1 font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border-2-charcoal shadow-retro-sm active:translate-y-[2px] active:shadow-retro-none transition-all text-xs">
           <ChevronLeft size={16} strokeWidth={2.5} /> Volver
        </button>
        
        <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] mb-2 animate-in slide-in-from-left">Configuración</h2>
        <p className="text-sm font-bold text-[#3D405B] mb-6 uppercase tracking-wide animate-in slide-in-from-left delay-100">{appMode.replace('CdB_ ', '')}</p>

        <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <label className="block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-3">Modo de Juego</label>
          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={() => setGameMode(GameMode.SOLO)}
               className={`p-3 rounded-xl border-2-charcoal text-center transition-all hover:-translate-y-1 ${gameMode === GameMode.SOLO ? 'bg-[#81B29A] text-[#1F2937] shadow-retro-sm' : 'bg-white text-[#A0AEC0] border-transparent'}`}
             >
                <User className="mx-auto mb-1" size={20} strokeWidth={2} />
                <span className="font-bold text-xs uppercase">Solo</span>
             </button>
             <button 
               onClick={() => setGameMode(GameMode.DUEL)}
               className={`p-3 rounded-xl border-2-charcoal text-center transition-all hover:-translate-y-1 ${gameMode === GameMode.DUEL ? 'bg-[#E07A5F] text-[#FFFBF0] shadow-retro-sm' : 'bg-white text-[#A0AEC0] border-transparent'}`}
             >
                <Swords className="mx-auto mb-1" size={20} strokeWidth={2} />
                <span className="font-bold text-xs uppercase">Duelo</span>
             </button>
          </div>
        </div>

        {gameMode === GameMode.DUEL && (
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            
            {/* Challenge Friend Section */}
            <div className="mb-6 bg-[#F4F1DE] rounded-xl border-2-charcoal p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-[#3D405B] uppercase tracking-widest flex items-center gap-1">
                        <UserPlus size={12} /> Desafía a un amigo
                    </label>
                    {challengeStatus === 'counting' && (
                         <span className="text-xs font-mono font-bold text-[#E07A5F] animate-pulse">{challengeTimer}s</span>
                    )}
                </div>

                {challengeStatus === 'idle' || challengeStatus === 'expired' ? (
                     <button 
                        onClick={startChallenge}
                        disabled={challengeStatus === 'expired'}
                        className={`w-full py-2 rounded-lg font-bold text-xs border-2-charcoal flex items-center justify-center gap-2 transition-all ${
                            challengeStatus === 'expired' 
                             ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                             : 'bg-white hover:bg-[#F2CC8F] text-[#1F2937]'
                        }`}
                     >
                        {challengeStatus === 'expired' ? 'Tiempo Agotado' : 'Crear Reto'}
                     </button>
                ) : challengeStatus === 'connected' ? (
                     <div className="bg-[#81B29A] text-[#1F2937] p-3 rounded-lg border-2-charcoal flex items-center justify-center gap-2 font-bold text-xs animate-pop">
                         <CheckCircle2 size={16} /> ¡Amigo Conectado!
                     </div>
                ) : (
                     <div className="space-y-2">
                         <button 
                            onClick={sendChallengeWhatsApp}
                            className="w-full bg-[#25D366] text-white py-2 rounded-lg font-bold text-xs border-2-charcoal flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-sm"
                         >
                            <MessageCircle size={16} /> Enviar por WhatsApp
                         </button>
                         <p className="text-[9px] text-center font-bold text-[#3D405B] opacity-60">
                             Esperando conexión...
                         </p>
                     </div>
                )}
            </div>

            <label className={`block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-3 ${challengeStatus === 'connected' ? 'opacity-50' : ''}`}>Elige Oponente (Bot)</label>
            <div className={`flex gap-3 overflow-x-auto pb-4 no-scrollbar ${challengeStatus === 'connected' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              {OPPONENTS.map(opp => (
                <button
                  key={opp.name}
                  onClick={() => setSelectedOpponent(opp)}
                  className={`min-w-[100px] p-3 rounded-xl border-2-charcoal flex flex-col items-center transition-all ${selectedOpponent.name === opp.name ? 'bg-[#F2CC8F] shadow-retro-sm scale-105' : 'bg-white opacity-60'}`}
                >
                  <div className="text-2xl mb-1">{opp.avatar}</div>
                  <div className="font-bold text-xs">{opp.name}</div>
                  <div className="text-[9px] uppercase font-bold text-[#3D405B]">{opp.difficulty}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isIdiomas ? (
            <>
                <div className="mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <label className="block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-3">Idioma Objetivo</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(Language).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`p-4 rounded-xl font-bold border-2-charcoal transition-all hover:-translate-y-1 active:translate-y-[1px] ${
                          selectedLanguage === lang ? 'bg-[#F2CC8F] text-[#1F2937] shadow-retro-sm' : 'bg-white text-[#3D405B] shadow-sm'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 flex-1 animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <label className="block text-[10px] font-bold text-[#3D405B] uppercase tracking-widest mb-3">Temática</label>
                  <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
                    {Object.values(Topic).map((topic, index) => {
                      const locked = isTopicLocked(topic);
                      return (
                        <button
                          key={topic}
                          disabled={locked}
                          onClick={() => setSelectedTopic(topic)}
                          className={`p-4 rounded-xl border-2-charcoal text-left flex justify-between items-center transition-all ${
                            locked 
                              ? 'bg-[#EDF2F7] opacity-60 cursor-not-allowed' 
                              : selectedTopic === topic 
                                ? 'bg-[#98C1D9] text-[#1F2937] shadow-retro-sm ring-2 ring-[#1F2937] ring-offset-2' 
                                : 'bg-white text-[#1F2937] hover:bg-[#F0F4F8]'
                          }`}
                        >
                          <span className="font-bold">{topic}</span>
                          {locked ? <Lock size={16} /> : selectedTopic === topic && <CheckCircle2 size={18} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
            </>
        ) : (
            <div className="mb-8 flex-1 animate-slide-up bg-white p-6 rounded-2xl border-2-charcoal shadow-sm flex items-center justify-center text-center" style={{ animationDelay: '200ms' }}>
                <div>
                   <div className="inline-block p-4 rounded-full bg-[#F4F1DE] mb-4 border-2-charcoal">
                      {APPS_CONFIG.find(a => a.mode === appMode)?.icon}
                   </div>
                   <h3 className="font-bold text-lg mb-2">Modo Temático Activado</h3>
                   <p className="text-sm text-[#3D405B]">Las preguntas se generarán automáticamente sobre este tema específico.</p>
                </div>
            </div>
        )}

        <button 
          onClick={handleStartGame}
          disabled={isIdiomas && (!selectedLanguage || !selectedTopic)}
          className="w-full bg-[#1F2937] text-[#FFFBF0] font-bold py-4 rounded-xl border-2-charcoal shadow-retro active:translate-y-[2px] active:shadow-retro-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto flex justify-center items-center gap-2 text-lg hover:bg-black"
        >
          <span>COMENZAR</span>
          <ArrowRightCircle size={24} />
        </button>
      </div>
    );
  }

  // 4. LOADING VIEW
  if (gameState === GameState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500" style={appStyle}>
        <div className="bg-[#FFFBF0] p-8 rounded-[32px] border-2-charcoal shadow-retro flex flex-col items-center max-w-xs animate-pop">
           <Loader2 size={48} className="animate-spin text-[#1F2937] mb-4" strokeWidth={2.5} />
           <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Preparando el Servicio...</h2>
           <p className="text-[#3D405B] text-sm font-bold opacity-80 animate-pulse">
             El Chef IA está seleccionando las mejores preguntas.
           </p>
        </div>
      </div>
    );
  }

  // 5. PLAYING VIEW
  if (gameState === GameState.PLAYING) {
    const currentQuestion = deck[currentQuestionIndex];
    const buttonLayout = profile.settings.buttonLayout;

    // Layout positioning logic
    const getSideButtonClass = (side: 'left' | 'right') => {
        const base = "absolute w-12 h-12 rounded-full border-2-charcoal shadow-retro-sm flex items-center justify-center active:scale-95 hover:scale-110 transition-all z-20";
        
        if (buttonLayout === 'compact') {
             // Closer to card center
             return `${base} ${side === 'left' ? 'left-8' : 'right-8'} top-1/2 -translate-y-1/2 bg-[${side === 'left' ? '#81B29A' : '#E07A5F'}] text-[${side === 'left' ? '#1F2937' : '#FFFBF0'}]`;
        } else if (buttonLayout === 'spread') {
             // Far corners of the screen container
             return `${base} ${side === 'left' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 bg-[${side === 'left' ? '#81B29A' : '#E07A5F'}] text-[${side === 'left' ? '#1F2937' : '#FFFBF0'}]`;
        }
        // Standard
        return `${base} ${side === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 bg-[${side === 'left' ? '#81B29A' : '#E07A5F'}] text-[${side === 'left' ? '#1F2937' : '#FFFBF0'}]`;
    };

    return (
      <div className="fixed inset-0 overflow-hidden flex flex-col transition-colors duration-500" style={appStyle}>
        {/* Game Header */}
        <div className="p-4 z-10 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b-2 border-[#1F2937]">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#F2CC8F] rounded-full flex items-center justify-center border-2-charcoal font-bold text-sm shadow-sm">
                 {currentQuestionIndex + 1}/{deck.length}
               </div>
               {gameMode === GameMode.DUEL && (
                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border-2-charcoal relative">
                    <div className="relative">
                        <span className="text-xl">{profile.selectedAvatar}</span>
                        {/* Player Score Pop Animation could go here */}
                    </div>
                    
                    <div className="flex flex-col items-center leading-none px-1">
                        <span className="font-bold text-sm text-[#1F2937]">{sessionScore}</span>
                    </div>

                    <span className="text-[10px] font-bold text-[#3D405B]">VS</span>
                    
                    <div className="flex flex-col items-center leading-none px-1">
                        <span className="font-bold text-sm text-[#E07A5F]">{opponentScore}</span>
                    </div>

                    <div className="relative">
                        <span className={`text-xl block ${Date.now() - opponentLastScoreTime < 500 ? 'scale-125' : ''} transition-transform`}>{selectedOpponent.avatar}</span>
                        {/* Opponent Hit Animation */}
                        {Date.now() - opponentLastScoreTime < 800 && (
                            <div className="absolute -top-4 -right-2 text-[#E07A5F] font-bold text-xs animate-float-score">+1</div>
                        )}
                         {Date.now() - opponentLastScoreTime < 500 && (
                            <div className="absolute inset-0 rounded-full animate-opponent-score"></div>
                        )}
                    </div>
                 </div>
               )}
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setGameState(GameState.PROFILE)} className="w-10 h-10 bg-[#E07A5F] text-[#FFFBF0] rounded-full flex items-center justify-center border-2-charcoal shadow-sm hover:scale-105 active:scale-95 transition-all">
                    <LogOut size={18} strokeWidth={3} />
                 </button>
            </div>
        </div>

        {/* Progress Bar for Duel Mode - TUG OF WAR Style */}
        {gameMode === GameMode.DUEL && (
            <div className="h-4 w-full bg-[#1F2937] flex relative border-b-2 border-[#1F2937]">
                <div 
                    className="bg-[#81B29A] h-full transition-all duration-500 relative" 
                    style={{ width: `${(sessionScore / (Math.max(1, sessionScore + opponentScore))) * 100}%` }}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50"></div>
                </div>
                <div className="bg-[#E07A5F] h-full flex-1 transition-all duration-500"></div>
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2"></div>
            </div>
        )}

        {/* Card Deck Area - Centered Grid for stability */}
        <div className="flex-1 w-full px-8 grid place-items-center relative z-0">
           {/* Card container needs distinct grid placement */}
           <div className="w-full max-w-xs aspect-[3/4.2] grid place-items-center relative">
             {deck.slice(currentQuestionIndex, currentQuestionIndex + 3).map((q, index) => (
               <Card 
                 key={q.id} 
                 question={q} 
                 index={index} 
                 totalCards={deck.length}
                 onSwipe={handleSwipe} 
                 triggerAction={cardAction}
               />
             ))}
           </div>

           {/* Side buttons placed absolutely relative to the center grid area to ensure they are clickable but don't overlap */}
           {!isAnswering && !isModalExiting && (
             <>
                <button 
                  onClick={() => triggerCardAction('left')}
                  className={getSideButtonClass('left').replace('bg-[#81B29A]', 'bg-[#81B29A]').replace('text-[#1F2937]', 'text-[#1F2937]')}
                >
                  <ArrowLeft size={24} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => triggerCardAction('right')}
                  className={getSideButtonClass('right').replace('bg-[#E07A5F]', 'bg-[#E07A5F]').replace('text-[#FFFBF0]', 'text-[#FFFBF0]')}
                >
                  <ArrowRight size={24} strokeWidth={3} />
                </button>
             </>
           )}
        </div>

        {/* Vertical Buttons */}
        {!isAnswering && !isModalExiting && (
           <div className="relative h-24 w-full">
              <button 
                 onClick={() => triggerCardAction('up')}
                 className={`absolute ${buttonLayout === 'compact' ? '-top-12' : '-top-16'} left-1/2 -translate-x-1/2 w-12 h-12 bg-[#98C1D9] text-[#1F2937] rounded-full border-2-charcoal shadow-retro-sm flex items-center justify-center active:scale-95 hover:scale-110 transition-all z-20`}
              >
                 <ArrowUp size={24} strokeWidth={3} />
              </button>
              <button 
                 onClick={() => triggerCardAction('down')}
                 className={`absolute ${buttonLayout === 'compact' ? 'top-0' : 'top-2'} left-1/2 -translate-x-1/2 w-12 h-12 bg-[#F2CC8F] text-[#1F2937] rounded-full border-2-charcoal shadow-retro-sm flex items-center justify-center active:scale-95 hover:scale-110 transition-all z-20`}
              >
                 <ArrowDown size={24} strokeWidth={3} />
              </button>
           </div>
        )}

        {/* Answering Modal */}
        {(isAnswering || isModalExiting) && (
          <div className={`fixed inset-0 z-[200] p-4 flex flex-col items-center justify-center transition-colors duration-500 ${
            answeredState === 'correct' ? 'bg-[#81B29A]' : 
            answeredState === 'incorrect' ? 'bg-[#E07A5F]' : 
            'bg-[#1F2937]/90 backdrop-blur-md'
          } ${isModalExiting ? 'animate-slide-out-top pointer-events-none' : 'animate-in fade-in duration-300'}`}>
             
             {/* Main Modal Container */}
             <div 
               // Key change triggers re-animation when state changes
               key={answeredState || 'unanswered'}
               className={`bg-[#FFFBF0] w-full max-w-md rounded-[32px] p-6 border-2-charcoal shadow-2xl relative flex flex-col max-h-[85vh] transition-transform duration-300 ${
                 answeredState === 'incorrect' ? 'animate-shake' : answeredState === 'correct' ? 'animate-pop' : 'animate-slide-up'
               }`}
             >
                {/* Visual Feedback Stamp */}
                {answeredState === 'correct' && (
                    <div className="absolute top-4 right-4 text-[#81B29A] animate-pop opacity-20 rotate-12 pointer-events-none">
                        <CheckCircle2 size={120} />
                    </div>
                )}
                {answeredState === 'incorrect' && (
                    <div className="absolute top-4 right-4 text-[#E07A5F] animate-pop opacity-20 -rotate-12 pointer-events-none">
                        <AlertCircle size={120} />
                    </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10 shrink-0">
                    <div>
                         <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#1F2937]/10 mb-2 ${getDifficultyColor(currentQuestion.difficulty)}`}>
                             {currentQuestion.difficulty || 'Normal'}
                         </span>
                         <h3 className="text-lg font-bold text-[#1F2937] leading-tight pr-4">{currentQuestion.questionText}</h3>
                    </div>
                    {!answeredState && (
                        <div className="flex items-center gap-1.5 bg-[#F2CC8F] px-3 py-1.5 rounded-full border-2-charcoal animate-pulse">
                           <Timer size={16} />
                           <span className="font-bold text-sm font-mono">{(quizTimer / 10).toFixed(1)}s</span>
                        </div>
                    )}
                </div>

                {/* Content Scrollable Area */}
                <div className="overflow-y-auto no-scrollbar flex-1 -mx-2 px-2 pb-2">
                    {/* Options / History */}
                    <div className="grid grid-cols-1 gap-3 mb-4 relative z-10">
                    {currentQuestion.options.map((opt, idx) => {
                        let stateClass = 'bg-white hover:bg-[#F0F4F8] border-2-charcoal';
                        let icon = null;

                        if (answeredState) {
                            if (opt === currentQuestion.correctAnswer) {
                                stateClass = 'bg-[#81B29A] text-[#1F2937] border-2-charcoal';
                                icon = <Check size={20} strokeWidth={3} />;
                            } else if (opt === selectedAnswer) {
                                stateClass = 'bg-[#E07A5F] text-[#FFFBF0] border-2-charcoal';
                                icon = <X size={20} strokeWidth={3} />;
                            } else {
                                stateClass = 'bg-gray-100 text-gray-400 border-gray-200 opacity-50';
                            }
                        }

                        return (
                            <button
                            key={idx}
                            disabled={!!answeredState}
                            onClick={() => handleAnswer(opt)}
                            className={`p-4 rounded-xl text-left font-bold transition-all active:scale-[0.98] flex items-center justify-between ${stateClass} ${!answeredState && 'shadow-sm hover:shadow-retro-sm'}`}
                            >
                            <span>{opt}</span>
                            {icon}
                            </button>
                        );
                    })}
                    </div>

                    {/* Explanation & Feedback */}
                    {answeredState && (
                        <div className="animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="bg-[#F4F1DE] p-4 rounded-xl border-2-charcoal mb-4 relative">
                                <h4 className="font-bold text-[#1F2937] flex items-center gap-2 mb-2">
                                    <Sparkles size={18} className="text-[#E07A5F]" /> 
                                    Explicación
                                </h4>
                                <p className="text-sm text-[#3D405B] leading-relaxed font-medium">
                                    {currentQuestion.explanation}
                                </p>
                                
                                {/* Pronunciation Practice (Post-Answer) - Only for Idiomas */}
                                {appMode === AppMode.IDIOMAS && (
                                    <div className="mt-4 pt-4 border-t-2 border-[#1F2937]/10">
                                        
                                        {/* Header with Title and Play Button */}
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-xs uppercase tracking-widest text-[#3D405B]">Practica</h5>
                                            </div>
                                            <button 
                                                onClick={() => playPronunciation(currentQuestion.correctAnswer)}
                                                disabled={isPlayingAudio}
                                                className="flex items-center gap-1 bg-[#1F2937] text-[#FFFBF0] px-3 py-1 rounded-full text-[10px] font-bold hover:bg-black disabled:opacity-50 transition-colors"
                                            >
                                                {isPlayingAudio ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                                                ESCUCHAR
                                            </button>
                                        </div>

                                        {/* Compact Retro Player Interface */}
                                        <div className="bg-[#1F2937] rounded-xl p-3 border-2 border-[#1F2937] shadow-inner relative overflow-hidden">
                                            
                                            {isAnalyzing ? (
                                                <div className="flex items-center justify-center gap-3 text-[#FFFBF0] h-12 animate-pulse">
                                                    <Loader2 size={20} className="animate-spin text-[#81B29A]" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Procesando audio...</span>
                                                </div>
                                            ) : pronunciationResult ? (
                                                <div className="flex items-center justify-between w-full px-2">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[#FFFBF0] text-[10px] font-bold uppercase tracking-widest opacity-60">Puntuación</span>
                                                        <div className={`px-4 py-1.5 rounded-full font-bold font-mono text-lg border-2 ${
                                                            pronunciationResult.score > 80 ? 'bg-[#81B29A] text-[#1F2937] border-[#81B29A]' : 
                                                            pronunciationResult.score > 50 ? 'bg-[#F2CC8F] text-[#1F2937] border-[#F2CC8F]' : 
                                                            'bg-[#E07A5F] text-[#FFFBF0] border-[#E07A5F]'
                                                        }`}>
                                                            {pronunciationResult.score}
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={startRecording}
                                                        className="w-10 h-10 rounded-full bg-[#3D405B] text-[#FFFBF0] flex items-center justify-center hover:bg-[#4a4e69] active:scale-95 transition-all shadow-sm border border-white/10"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Recording Interface */
                                                <div className="flex items-center gap-3">
                                                     {/* Simple Visualizer */}
                                                    <div className="flex-1 h-8 bg-[#3D405B]/30 rounded-lg flex items-center gap-0.5 px-2 overflow-hidden">
                                                        {[...Array(12)].map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`flex-1 bg-[#E07A5F] rounded-full transition-all duration-75 ${isRecording ? 'animate-[wave-stretch_0.5s_ease-in-out_infinite]' : 'h-1 opacity-30'}`}
                                                                style={{ animationDelay: `${i * 0.05}s`, height: isRecording ? `${Math.random() * 80 + 20}%` : '4px' }}
                                                            ></div>
                                                        ))}
                                                    </div>

                                                    {/* Record Button */}
                                                    <button 
                                                        onClick={isRecording ? stopRecording : startRecording}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                                                            isRecording 
                                                                ? 'bg-[#E07A5F] border-[#FFFBF0] animate-pulse text-[#FFFBF0]' 
                                                                : 'bg-[#FFFBF0] border-transparent text-[#E07A5F] hover:bg-[#E07A5F] hover:text-[#FFFBF0]'
                                                        }`}
                                                    >
                                                        {isRecording ? <div className="w-3 h-3 bg-white rounded-sm"></div> : <Mic size={20} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Continue Button - Sticky at bottom of modal */}
                {answeredState && (
                    <div className="mt-4 shrink-0">
                        <button 
                            onClick={handleContinue}
                            className="w-full bg-[#1F2937] text-[#FFFBF0] py-4 rounded-xl font-bold uppercase tracking-widest border-2-charcoal shadow-retro active:translate-y-[2px] active:shadow-none transition-all hover:bg-black"
                        >
                            Continuar
                        </button>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    );
  }

  // 6. RESULTS VIEW
  if (gameState === GameState.RESULTS) {
    // Solo Victory: >50% correct
    // Duel Victory: My Score > Opponent Score
    const isVictory = gameMode === GameMode.DUEL 
        ? sessionScore > opponentScore 
        : sessionScore >= (deck.length / 2);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500" style={appStyle}>
        <div className="bg-[#FFFBF0] p-8 rounded-[32px] border-2-charcoal shadow-retro w-full max-w-sm animate-pop">
           <div className="mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
             {isVictory ? (
                <div className="w-24 h-24 bg-[#81B29A] rounded-full mx-auto flex items-center justify-center border-2-charcoal shadow-sm mb-4">
                    <Trophy size={48} className="text-[#1F2937]" />
                </div>
             ) : (
                <div className="w-24 h-24 bg-[#E07A5F] rounded-full mx-auto flex items-center justify-center border-2-charcoal shadow-sm mb-4">
                    <XCircle size={48} className="text-[#FFFBF0]" />
                </div>
             )}
             
             <h2 className="text-3xl font-bold text-[#1F2937] mb-1">
                 {isVictory ? (gameMode === GameMode.DUEL ? '¡Has ganado el Duelo!' : '¡Servicio Excelente!') : (gameMode === GameMode.DUEL ? 'Has perdido...' : '¡A la cocina!')}
             </h2>
             
             <p className="text-[#3D405B] font-bold uppercase tracking-wider text-xs">
                 {isVictory ? `Has ganado +${sessionScore * XP_PER_CORRECT} XP` : 'Necesitas practicar más'}
             </p>
           </div>

           {gameMode === GameMode.DUEL ? (
               <div className="bg-[#F4F1DE] p-4 rounded-2xl border-2-charcoal mb-8 animate-slide-up flex justify-center items-center gap-4" style={{ animationDelay: '400ms' }}>
                   <div className="text-center">
                       <div className="text-2xl">{profile.selectedAvatar}</div>
                       <div className="font-bold text-[#1F2937]">{sessionScore}</div>
                   </div>
                   <div className="font-bold text-xs text-[#3D405B]">VS</div>
                   <div className="text-center">
                       <div className="text-2xl">{selectedOpponent.avatar}</div>
                       <div className="font-bold text-[#E07A5F]">{opponentScore}</div>
                   </div>
               </div>
           ) : (
               <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="bg-[#F4F1DE] p-4 rounded-2xl border-2-charcoal">
                     <div className="text-3xl font-bold text-[#1F2937]">{sessionScore}/{deck.length}</div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-[#3D405B]">Aciertos</div>
                  </div>
                  <div className="bg-[#F4F1DE] p-4 rounded-2xl border-2-charcoal">
                     <div className="text-3xl font-bold text-[#1F2937]">{Math.round((sessionScore / deck.length) * 100)}%</div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-[#3D405B]">Precisión</div>
                  </div>
               </div>
           )}

           <div className="space-y-3 animate-slide-up" style={{ animationDelay: '600ms' }}>
                <button 
                  onClick={handleShare}
                  className="w-full bg-[#F2CC8F] hover:bg-[#eac07d] text-[#1F2937] font-bold py-3 rounded-xl border-2-charcoal shadow-retro-sm active:translate-y-[1px] active:shadow-retro-none transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  COMPARTIR RESULTADO
                </button>
                <button 
                  onClick={() => setGameState(GameState.PROFILE)}
                  className="w-full bg-[#1F2937] text-[#FFFBF0] font-bold py-3 rounded-xl border-2-charcoal shadow-retro active:translate-y-[2px] active:shadow-retro-none transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  VOLVER AL PERFIL
                </button>
           </div>
        </div>
      </div>
    );
  }

  // 7. LEADERBOARD VIEW
  if (gameState === GameState.LEADERBOARD) {
    // Filter and Sort Logic
    const getScore = (entry: LeaderboardEntry) => {
        if (leaderboardTab === 'GLOBAL') return entry.xp;
        return entry.xpBreakdown?.[leaderboardTab] || 0;
    };

    const currentLeaderboard = [
        ...MOCK_LEADERBOARD, 
        { 
            nickname: profile.nickname, 
            xp: profile.xp, 
            level: profile.level, 
            isUser: true,
            xpBreakdown: profile.xpBreakdown 
        }
    ].sort((a, b) => getScore(b) - getScore(a));

    return (
      <div className="min-h-screen flex flex-col items-center p-6 text-[#1F2937] transition-colors duration-500" style={appStyle}>
        <header className="w-full max-w-md flex items-center mb-6 mt-4">
            <button onClick={() => setGameState(GameState.PROFILE)} className="mr-4 w-12 h-12 flex items-center justify-center bg-white border-2-charcoal rounded-full shadow-retro-sm hover:scale-105 transition-transform">
               <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h1 className="font-bold text-2xl tracking-tight text-[#1F2937]">Ranking</h1>
        </header>

        {/* Tabs */}
        <div className="w-full max-w-md flex overflow-x-auto gap-2 pb-4 mb-2 no-scrollbar animate-slide-up">
            <button
                onClick={() => setLeaderboardTab('GLOBAL')}
                className={`px-4 py-2 rounded-full border-2-charcoal font-bold text-xs whitespace-nowrap transition-all ${leaderboardTab === 'GLOBAL' ? 'bg-[#1F2937] text-[#FFFBF0]' : 'bg-white text-[#1F2937]'}`}
            >
                GLOBAL
            </button>
            {APPS_CONFIG.map(app => (
                <button
                    key={app.mode}
                    onClick={() => setLeaderboardTab(app.mode)}
                    className={`px-4 py-2 rounded-full border-2-charcoal font-bold text-xs whitespace-nowrap transition-all ${leaderboardTab === app.mode ? 'bg-[#1F2937] text-[#FFFBF0]' : 'bg-white text-[#1F2937]'}`}
                >
                    {app.mode.replace('CdB_ ', '')}
                </button>
            ))}
        </div>

        <div className="w-full max-w-md bg-[#FFFBF0] rounded-[24px] p-4 border-2-charcoal shadow-retro flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto pr-1 flex-1">
                {currentLeaderboard.map((entry, idx) => {
                    const score = getScore(entry);
                    const isTop3 = idx < 3;
                    
                    return (
                        <div 
                            key={idx} 
                            className={`flex items-center p-3 mb-3 rounded-xl border-2-charcoal transition-transform animate-slide-up ${entry.isUser ? 'bg-[#F2CC8F] scale-[1.02] shadow-sm ring-2 ring-[#1F2937] ring-offset-2' : 'bg-white'}`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2-charcoal font-bold text-sm mr-3 shrink-0 ${
                                idx === 0 ? 'bg-[#F2CC8F] text-[#1F2937]' : 
                                idx === 1 ? 'bg-[#E5E7EB] text-[#1F2937]' : 
                                idx === 2 ? 'bg-[#E07A5F] text-[#FFFBF0]' : 'bg-[#1F2937] text-[#FFFBF0]'
                            }`}>
                                {isTop3 && idx === 0 ? <Crown size={14} /> : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[#1F2937] truncate">{entry.nickname} {entry.isUser && '(Tú)'}</div>
                                <div className="text-[10px] font-bold text-[#3D405B] uppercase">Nivel {entry.level}</div>
                            </div>
                            <div className="font-mono font-bold text-[#1F2937]">
                                {score.toLocaleString()} XP
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
  }

  // 8. HISTORY VIEW
  if (gameState === GameState.HISTORY) {
    const sortedHistory = [...profile.history].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="min-h-screen flex flex-col items-center p-6 text-[#1F2937] transition-colors duration-500" style={appStyle}>
            <header className="w-full max-w-md flex items-center mb-6 mt-4">
                <button onClick={() => setGameState(GameState.PROFILE)} className="mr-4 w-12 h-12 flex items-center justify-center bg-white border-2-charcoal rounded-full shadow-retro-sm hover:scale-105 transition-transform">
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="font-bold text-2xl tracking-tight text-[#1F2937]">Historial</h1>
            </header>

            <div className="w-full max-w-md flex-1 overflow-y-auto no-scrollbar pb-8">
                {sortedHistory.length === 0 ? (
                    <div className="text-center p-10 opacity-50 font-bold text-[#3D405B]">
                        Aún no has respondido preguntas.
                    </div>
                ) : (
                    sortedHistory.map((entry, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border-2-charcoal mb-3 shadow-sm flex flex-col gap-2 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                             <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-[#1F2937]/10 ${APPS_CONFIG.find(a => a.mode === entry.mode)?.color || 'bg-gray-100'}`}>
                                    {entry.mode.replace('CdB_ ', '')}
                                </span>
                                <span className="text-[10px] font-bold text-[#3D405B] opacity-50">
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                             </div>
                             <p className="font-bold text-sm leading-tight">{entry.questionText}</p>
                             <div className="flex items-center gap-2 mt-1">
                                 {entry.isCorrect ? (
                                     <span className="bg-[#81B29A] text-[#1F2937] text-xs font-bold px-2 py-1 rounded-lg border-2-charcoal flex items-center gap-1">
                                         <Check size={12} strokeWidth={3} /> {entry.selectedAnswer}
                                     </span>
                                 ) : (
                                    <>
                                        <span className="bg-[#E07A5F] text-[#FFFBF0] text-xs font-bold px-2 py-1 rounded-lg border-2-charcoal flex items-center gap-1 opacity-80 line-through decoration-2">
                                            {entry.selectedAnswer}
                                        </span>
                                        <span className="bg-[#81B29A] text-[#1F2937] text-xs font-bold px-2 py-1 rounded-lg border-2-charcoal flex items-center gap-1">
                                            <Check size={12} strokeWidth={3} /> {entry.correctAnswer}
                                        </span>
                                    </>
                                 )}
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  }

  return null;
}