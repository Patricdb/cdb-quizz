
export enum Language {
  ENGLISH = 'Inglés',
  FRENCH = 'Francés',
}

export enum AppMode {
  IDIOMAS = 'CdB_ Idiomas',
  CERVEZA = 'CdB_ Cerveza',
  VINO = 'CdB_ Vino',
  L43 = 'CdB_ L43',
  CULTURA = 'CdB_ Cultura de Bar',
  LEGAL = 'CdB_ Legal'
}

export enum Topic {
  INGREDIENTS = 'Ingredientes',
  DISHES = 'Platos Típicos',
  MEAT = 'Carnes',
  FISH = 'Pescados y Mariscos',
  DRINKS = 'Bebidas, Vinos y Cervezas',
  SERVICE = 'Atención al Cliente',
  UTENSILS = 'Utensilios y Menaje'
}

export type Difficulty = 'Fácil' | 'Medio' | 'Difícil';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlockedAtLevel: number;
}

export interface HistoryEntry {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  mode: AppMode;
}

export interface QuizSource {
  id: string;
  name: string;
  type: 'API' | 'Database' | 'Manual';
  enabled: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  backgroundColor: string; // Hex Code
  buttonLayout: 'standard' | 'spread' | 'compact';
  cardBorderRadius: number; // px
}

export interface UserProfile {
  nickname: string;
  selectedAvatar: string;
  totalCorrect: number;
  totalTimeSeconds: number;
  xp: number;
  level: number;
  badges: string[];
  history: HistoryEntry[];
  xpBreakdown: Record<string, number>;
  settings: AppSettings;
  quizSources: Record<string, QuizSource[]>; // Map AppMode to sources
}

export enum GameState {
  INTRO = 'INTRO',
  PROFILE = 'PROFILE',
  MENU = 'MENU',
  SETUP = 'SETUP',
  LOBBY = 'LOBBY', 
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS',
  LEADERBOARD = 'LEADERBOARD',
  HISTORY = 'HISTORY',
  ADMIN_MENU = 'ADMIN_MENU',
}

export enum GameMode {
  SOLO = 'SOLO',
  DUEL = 'DUEL'
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
}

export interface LeaderboardEntry {
  nickname: string;
  xp: number;
  level: number;
  isUser?: boolean;
  xpBreakdown?: Record<string, number>;
}

export interface Opponent {
  name: string;
  avatar: string;
  difficulty: 'easy' | 'medium' | 'hard';
  speed: number; // ms per answer
}