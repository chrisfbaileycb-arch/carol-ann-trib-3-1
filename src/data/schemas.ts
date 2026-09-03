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
  favoriteMusic?: string[];
  faithSymbols?: string[];
  culinaryInterests?: string[];
  profileSong?: string;
  profileQuote?: string;
  wallpaperPreset?: string;
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
  agentId?: string;
  toolCall?: HydrateFormAction;
}

export type HydrateCategory = 'errand' | 'profile_intake' | 'calendar_booking' | 'scratchpad_update';

export interface FormPayload {
  title: string;
  items?: string[];
  target_time?: string;
  notes?: string;
  fields?: Record<string, string | number | boolean>;
}

export interface HydrateFormAction {
  id: string;
  category: HydrateCategory;
  action_name: string;
  form_payload: FormPayload;
  requires_user_confirmation: boolean;
  status: 'pending_confirmation' | 'executed' | 'cancelled';
  timestamp: string;
  executed_at?: string;
}

export interface StickerWatermark {
  id: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
  category: 'sports' | 'music' | 'faith' | 'culinary' | 'aesthetic' | 'badge' | 'custom';
  opacity: number; // 0.05 to 0.6
  position:
    | 'top-right'
    | 'bottom-right'
    | 'top-left'
    | 'bottom-left'
    | 'center-subtle'
    | 'header-accent'
    | 'sidebar-badge'
    | 'chat-backdrop';
  scale: number; // 0.5 to 2.0
  active: boolean;
}

export interface ErrandTask {
  id: string;
  target: 'whole-foods' | 'amazon' | 'dry-cleaning' | 'custom';
  title: string;
  items: string[];
  status: 'draft' | 'queued' | 'dispatched' | 'completed';
  scheduled_time?: string;
  actionId?: string;
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
