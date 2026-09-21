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
  isFakeMemory, isFakeMessage,
} from '@/lib/memoryStore';
import { getTheme, type AestheticTheme } from '@/data/intake';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
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

  // Hydrate from cloud state on initial mount (server scopes to the signed-in user)
  useEffect(() => {
    fetchCloudState().then((cloud) => {
      if (cloud) {
        if (cloud.profile) setProfile((p) => ({ ...p, ...(cloud.profile as Partial<UserProfile>) }));
        if (Array.isArray(cloud.messages)) {
          const validMsgs = (cloud.messages as ConversationMessage[]).filter((m) => !isFakeMessage(m));
          if (validMsgs.length > 0) {
            setMessages((prev) => (prev.length > validMsgs.length ? prev : validMsgs));
          }
        }
        if (Array.isArray(cloud.memories)) {
          const validMems = (cloud.memories as MemoryEntry[]).filter((m) => !isFakeMemory(m));
          if (validMems.length > 0) {
            setMemories((prev) => (prev.length > validMems.length ? prev : validMems));
          }
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

  // Push state to cloud backend (server scopes to the signed-in user)
  useEffect(() => {
    const timer = setTimeout(() => {
      sendCloudSync({
        profile,
        messages: messages.slice(-50),
        checkIns: checkIns.slice(0, 30),
        memories: memories.slice(0, 50),
        errands,
        sessions: sessions.slice(0, 14),
      }).then((ok) => {
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
      await sendCloudSync({
        profile,
        messages: messages.slice(-50),
        checkIns: checkIns.slice(0, 30),
        memories: memories.slice(0, 50),
        errands,
        sessions: sessions.slice(0, 14),
      });

      if (user) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(
          userRef,
          {
            id: user.id,
            email: user.email,
            name: profile.name,
            identity: profile.identity,
            theme: profile.theme,
            sportsTeams: profile.sportsTeams,
            aesthetic: profile.aesthetic,
            accentColor: profile.accentColor,
            preferences: {
              interests: profile.interests,
              routine: profile.routine,
              wellnessGoal: profile.wellnessGoal,
              professionalFocus: profile.professionalFocus,
              affirmation: profile.affirmation,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );

        const workspaceRef = doc(db, 'workspaces', user.id);
        await setDoc(
          workspaceRef,
          {
            userId: user.id,
            lastSyncedAt: new Date().toISOString(),
            profile,
            messages: messages.slice(-25),
            checkIns: checkIns.slice(0, 20),
            memories: memories.slice(0, 40),
            errands,
            sessions: sessions.slice(0, 14),
          },
          { merge: true },
        );
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
