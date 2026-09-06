import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  UserProfile,
  ConversationMessage,
  CheckInRecord,
  MemoryEntry,
  ErrandTask,
  MyDaySession,
  DomainId,
} from '@/data/schemas';
import {
  loadProfile, saveProfile,
  loadMessages, saveMessages,
  loadCheckIns, saveCheckIns,
  loadMemories, saveMemories,
  loadErrands, saveErrands,
  loadSessions, saveSessions,
  uid, getDeviceKey,
  fetchCloudState, sendCloudSync,
} from '@/lib/memoryStore';
import { getTheme, type AestheticTheme } from '@/data/intake';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CarolContextValue {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  theme: AestheticTheme;
  messages: ConversationMessage[];
  addMessage: (m: Omit<ConversationMessage, 'id' | 'timestamp'>) => ConversationMessage;
  clearDomain: (domain: DomainId) => void;
  checkIns: CheckInRecord[];
  addCheckIn: (c: Omit<CheckInRecord, 'id' | 'timestamp'>) => void;
  memories: MemoryEntry[];
  addMemory: (m: Omit<MemoryEntry, 'id' | 'last_recalled'>) => void;
  removeMemory: (id: string) => void;
  errands: ErrandTask[];
  upsertErrand: (e: ErrandTask) => void;
  sessions: MyDaySession[];
  updateToday: (patch: Partial<MyDaySession>) => void;
  syncing: boolean;
  lastSync: string | null;
  syncError: string | null;
  syncToCloud: () => Promise<void>;
  deviceKey: string;
}

const CarolContext = createContext<CarolContextValue | undefined>(undefined);

export const CarolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [messages, setMessages] = useState<ConversationMessage[]>(loadMessages);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(loadCheckIns);
  const [memories, setMemories] = useState<MemoryEntry[]>(loadMemories);
  const [errands, setErrands] = useState<ErrandTask[]>(loadErrands);
  const [sessions, setSessions] = useState<MyDaySession[]>(loadSessions);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(new Date().toISOString());
  const [syncError, setSyncError] = useState<string | null>(null);
  const deviceKey = useMemo(() => getDeviceKey(), []);

  // Hydrate from cloud state on initial mount
  useEffect(() => {
    const userId = user?.id || deviceKey;
    fetchCloudState(userId).then((cloud) => {
      if (cloud) {
        if (cloud.profile) setProfile((p) => ({ ...p, ...(cloud.profile as Partial<UserProfile>) }));
        if (Array.isArray(cloud.messages) && cloud.messages.length > 0) {
          setMessages((prev) => (prev.length > (cloud.messages as ConversationMessage[]).length ? prev : (cloud.messages as ConversationMessage[])));
        }
        if (Array.isArray(cloud.memories) && cloud.memories.length > 0) {
          setMemories((prev) => (prev.length > (cloud.memories as MemoryEntry[]).length ? prev : (cloud.memories as MemoryEntry[])));
        }
        if (Array.isArray(cloud.errands) && cloud.errands.length > 0) {
          setErrands((prev) => (prev.length > (cloud.errands as ErrandTask[]).length ? prev : (cloud.errands as ErrandTask[])));
        }
        if (Array.isArray(cloud.checkIns) && cloud.checkIns.length > 0) {
          setCheckIns((prev) => (prev.length > (cloud.checkIns as CheckInRecord[]).length ? prev : (cloud.checkIns as CheckInRecord[])));
        }
      }
    }).catch(() => {
      /* Cloud hydration fallback */
    });
  }, [user?.id, deviceKey]);

  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveCheckIns(checkIns); }, [checkIns]);
  useEffect(() => { saveMemories(memories); }, [memories]);
  useEffect(() => { saveErrands(errands); }, [errands]);
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Push state to cloud backend
  useEffect(() => {
    const timer = setTimeout(() => {
      const userId = user?.id || deviceKey;
      sendCloudSync({
        profile,
        messages: messages.slice(-50),
        checkIns: checkIns.slice(0, 30),
        memories: memories.slice(0, 50),
        errands,
        sessions: sessions.slice(0, 14),
      }, userId).then((ok) => {
        if (ok) setLastSync(new Date().toISOString());
      }).catch(() => undefined);
    }, 1200);

    return () => clearTimeout(timer);
  }, [profile, messages, checkIns, memories, errands, sessions, user?.id, deviceKey]);

  const theme = useMemo(() => getTheme(profile.theme), [profile.theme]);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const addMessage = useCallback((m: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    const msg: ConversationMessage = { ...m, id: uid('msg'), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, msg].slice(-200));
    return msg;
  }, []);

  const clearDomain = useCallback((domain: DomainId) => {
    setMessages((prev) => prev.filter((m) => m.domain !== domain));
  }, []);

  const addCheckIn = useCallback((c: Omit<CheckInRecord, 'id' | 'timestamp'>) => {
    setCheckIns((prev) => [{ ...c, id: uid('ci'), timestamp: new Date().toISOString() }, ...prev].slice(0, 100));
  }, []);

  const addMemory = useCallback((m: Omit<MemoryEntry, 'id' | 'last_recalled'>) => {
    setMemories((prev) => [{ ...m, id: uid('mem'), last_recalled: new Date().toISOString() }, ...prev].slice(0, 200));
  }, []);

  const removeMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const upsertErrand = useCallback((e: ErrandTask) => {
    setErrands((prev) => {
      const i = prev.findIndex((x) => x.id === e.id);
      if (i === -1) return [e, ...prev];
      const next = [...prev];
      next[i] = e;
      return next;
    });
  }, []);

  const updateToday = useCallback((patch: Partial<MyDaySession>) => {
    const today = new Date().toISOString().slice(0, 10);
    setSessions((prev) => {
      const i = prev.findIndex((s) => s.date === today);
      if (i === -1) {
        return [{
          id: uid('day'), date: today, intention: '', mood_score: 6, energy_level: 6,
          reflections: [], completed_tasks: [], ...patch,
        }, ...prev];
      }
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const syncToCloud = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const userId = user?.id || deviceKey;
      await sendCloudSync({
        profile,
        messages: messages.slice(-50),
        checkIns: checkIns.slice(0, 30),
        memories: memories.slice(0, 50),
        errands,
        sessions: sessions.slice(0, 14),
      }, userId);

      if (user) {
        const { error: profileError } = await supabase.from('carol_ann_users').upsert(
          {
            user_id: user.id,
            device_id: deviceKey,
            device_key: deviceKey,
            email: user.email,
            name: profile.name,
            identity: profile.identity,
            theme: profile.theme,
            sports_teams: profile.sportsTeams,
            aesthetic: profile.aesthetic,
            accent_color: profile.accentColor,
            preferences: {
              interests: profile.interests,
              routine: profile.routine,
              wellnessGoal: profile.wellnessGoal,
              professionalFocus: profile.professionalFocus,
              affirmation: profile.affirmation,
            },
          },
          { onConflict: 'user_id' },
        );
        if (profileError) throw profileError;

        const recent = messages.slice(-25).map((m) => ({
          id: m.id, user_id: user.id, device_key: deviceKey, domain: m.domain, role: m.role, content: m.content,
        }));
        if (recent.length) await supabase.from('conversation_messages').upsert(recent, { onConflict: 'id' });

        const ci = checkIns.slice(0, 20).map((c) => ({
          id: c.id, user_id: user.id, device_key: deviceKey, type: c.type, label: c.label, notes: c.notes,
        }));
        if (ci.length) await supabase.from('check_ins').upsert(ci, { onConflict: 'id' });

        const mem = memories.slice(0, 40).map((m) => ({
          id: m.id, user_id: user.id, device_key: deviceKey, category: m.category, content: m.content, tags: m.tags,
        }));
        if (mem.length) await supabase.from('memories').upsert(mem, { onConflict: 'id' });

        const er = errands.map((e) => ({
          id: e.id, user_id: user.id, device_key: deviceKey, target: e.target, title: e.title,
          items: e.items, status: e.status, scheduled_time: e.scheduled_time ?? null,
        }));
        if (er.length) await supabase.from('errand_tasks').upsert(er, { onConflict: 'id' });

        const days = sessions.slice(0, 14).map((s) => ({
          id: s.id, user_id: user.id, device_key: deviceKey, date: s.date, intention: s.intention,
          mood_score: s.mood_score, energy_level: s.energy_level,
          reflections: s.reflections, completed_tasks: s.completed_tasks,
        }));
        if (days.length) await supabase.from('my_day_sessions').upsert(days, { onConflict: 'user_id,date' });
      }

      setLastSync(new Date().toISOString());
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Cloud sync notice.');
    } finally {
      setSyncing(false);
    }
  }, [user, deviceKey, profile, messages, checkIns, memories, errands, sessions]);

  const value: CarolContextValue = {
    profile, updateProfile, theme,
    messages, addMessage, clearDomain,
    checkIns, addCheckIn,
    memories, addMemory, removeMemory,
    errands, upsertErrand,
    sessions, updateToday,
    syncing, lastSync, syncError, syncToCloud, deviceKey,
  };


  return <CarolContext.Provider value={value}>{children}</CarolContext.Provider>;
};

export const useCarol = (): CarolContextValue => {
  const ctx = useContext(CarolContext);
  if (!ctx) throw new Error('useCarol must be used within CarolProvider');
  return ctx;
};
