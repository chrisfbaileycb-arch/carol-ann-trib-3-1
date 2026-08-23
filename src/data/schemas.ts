// ============================================================================
// Maggie: Sovereign Life Companion & Cloud Executive OS
// Single source of truth for all typed data structures.
// ============================================================================

export type DomainId =
  | 'core'
  | 'code'
  | 'gym'
  | 'kitchen'
  | 'garden'
  | 'faith'
  | 'errands'
  | 'family';

export interface UserProfile {
  id: string;
  name: string;
  identity: string;
  theme: string;
  sportsTeams: string[];
  aesthetic: string;
  accentColor: string;
  interests: string[];
  routine: string;
  wellnessGoal: string;
  professionalFocus: string;
  affirmation: string;
  email?: string;
  onboarded: boolean;
  created_at: string;
}

export interface MyDaySession {
  id: string;
  user_id?: string;
  date: string;
  intention: string;
  mood_score: number;
  energy_level: number;
  reflections: string[];
  completed_tasks: string[];
}

export interface CheckInRecord {
  id: string;
  type: 'physical' | 'mindset' | 'routine' | 'wellness';
  label: string;
  notes: string;
  timestamp: string;
}

export interface MemoryEntry {
  id: string;
  category: 'habit' | 'fitness' | 'nutrition' | 'preference' | 'people' | 'family';
  content: string;
  tags: string[];
  last_recalled: string;
}

export interface ConversationMessage {
  id: string;
  domain: DomainId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: string[];
  source?: 'desktop' | 'mobile' | 'voice' | 'vision';
  timestamp: string;
}

export interface ErrandTask {
  id: string;
  target: 'whole-foods' | 'amazon' | 'dry-cleaning' | 'custom';
  title: string;
  items: string[];
  status: 'draft' | 'queued' | 'dispatched' | 'completed';
  scheduled_time?: string;
}

export interface SavedMessage {
  id: string;
  messageId: string;
  content: string;
  domain: DomainId;
  savedAt: string;
}

export interface FeedbackEntry {
  id: string;
  messageId: string;
  rating: 'up' | 'down';
  note?: string;
  createdAt: string;
}

// --- Cloud runner ------------------------------------------------------------

export type RunStatus = 'pending' | 'running' | 'done' | 'failed';

export interface ErrandAction {
  id: string;
  command: string;
  step: string;
  status: RunStatus;
  output: string;
}

export interface AgentRun {
  id: string;
  chainKey: string;
  title: string;
  url: string;
  startedAt: string;
  status: RunStatus;
  actions: ErrandAction[];
  cursor: number;
}

export interface ActionLogEntry {
  id: string;
  ts: string;
  level: 'info' | 'action' | 'success' | 'warn';
  text: string;
}

// --- Canvas ------------------------------------------------------------------

export interface CanvasWidget {
  id: string;
  domainId: DomainId | 'stats' | 'playlist' | 'mood';
  pinned: boolean;
}

export interface UserCanvasSettings {
  name: string;
  bannerTexture: string;
  quote: string;
  favoriteTeam: string;
  aesthetic: string;
  moodTag: string;
  pinnedWidgets: string[];
}
