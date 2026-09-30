import { AGENT_SKILLS, AGENT_STACKS, type AgentSkill, type SkillCategory } from '@/data/skills';
import { KEYS, read, write, downloadFile } from './memoryStore';

export interface SkillInstallState {
  installed: string[];
  config: Record<string, Record<string, string>>;
}

const defaults = (): SkillInstallState => ({
  installed: AGENT_SKILLS.filter((s) => s.installedByDefault).map((s) => s.id),
  config: {},
});

// In-memory event listeners for instant reactive cross-component state updates
type SkillChangeListener = (state: SkillInstallState) => void;
const listeners = new Set<SkillChangeListener>();

const notifyListeners = (state: SkillInstallState) => {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error('[skillRegistry] listener error:', e);
    }
  });
};

export const subscribeToSkills = (listener: SkillChangeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let memoryCache: SkillInstallState | null = null;

export const loadRegistry = (): SkillInstallState => {
  if (memoryCache) return memoryCache;
  const r = read<SkillInstallState>(KEYS.skills, defaults());
  memoryCache = { installed: r.installed ?? [], config: r.config ?? {} };
  return memoryCache;
};

export const saveRegistry = (r: SkillInstallState) => {
  memoryCache = r;
  write(KEYS.skills, r);
  notifyListeners(r);
};

export const isSkillConnected = (id: string): boolean => {
  const r = loadRegistry();
  return r.installed.includes(id);
};

export const connectSkill = (id: string): SkillInstallState => {
  const r = loadRegistry();
  if (r.installed.includes(id)) return r;
  const next = { ...r, installed: [...r.installed, id] };
  saveRegistry(next);
  return next;
};

export const disconnectSkill = (id: string): SkillInstallState => {
  const r = loadRegistry();
  if (!r.installed.includes(id)) return r;
  const next = { ...r, installed: r.installed.filter((s) => s !== id) };
  saveRegistry(next);
  return next;
};

export const toggleSkill = (id: string): SkillInstallState => {
  const r = loadRegistry();
  const next = r.installed.includes(id)
    ? { ...r, installed: r.installed.filter((s) => s !== id) }
    : { ...r, installed: [...r.installed, id] };
  saveRegistry(next);
  return next;
};

export const connectAllSkills = (category?: SkillCategory): SkillInstallState => {
  const r = loadRegistry();
  const targets = category
    ? AGENT_SKILLS.filter((s) => s.category === category).map((s) => s.id)
    : AGENT_SKILLS.map((s) => s.id);
  const next = { ...r, installed: Array.from(new Set([...r.installed, ...targets])) };
  saveRegistry(next);
  return next;
};

export const connectAllEngineeringSkills = (): SkillInstallState => {
  const r = loadRegistry();
  const engIds = AGENT_SKILLS.filter((s) => s.category.startsWith('engineering-')).map((s) => s.id);
  const next = { ...r, installed: Array.from(new Set([...r.installed, ...engIds])) };
  saveRegistry(next);
  return next;
};

export const disconnectAllSkills = (category?: SkillCategory): SkillInstallState => {
  const r = loadRegistry();
  const next = {
    ...r,
    installed: category
      ? r.installed.filter((id) => {
          const sk = AGENT_SKILLS.find((s) => s.id === id);
          return sk && sk.category !== category;
        })
      : [],
  };
  saveRegistry(next);
  return next;
};

export const installStack = (stackId: string): SkillInstallState => {
  const stack = AGENT_STACKS.find((s) => s.id === stackId);
  const r = loadRegistry();
  if (!stack) return r;
  const next = { ...r, installed: Array.from(new Set([...r.installed, ...stack.skillIds])) };
  saveRegistry(next);
  return next;
};

export const setSkillConfig = (id: string, key: string, value: string): SkillInstallState => {
  const r = loadRegistry();
  const next = { ...r, config: { ...r.config, [id]: { ...(r.config[id] ?? {}), [key]: value } } };
  saveRegistry(next);
  return next;
};

export const getConnectedSkills = (): AgentSkill[] => {
  const r = loadRegistry();
  return AGENT_SKILLS.filter((s) => r.installed.includes(s.id));
};

export const getConnectedSkillsForAgent = (agentType: 'chat' | 'coding' | 'browser'): AgentSkill[] => {
  const connected = getConnectedSkills();
  return connected.filter((s) => !s.applicableAgents || s.applicableAgents.includes(agentType));
};

/**
 * Builds formatted system prompt directives for currently connected skills.
 * Injected into Chat, Coding, and Browser agents so they utilize loaded skills.
 */
export const getSkillsDirectivesPrompt = (agentType?: 'chat' | 'coding' | 'browser'): string => {
  const skills = agentType ? getConnectedSkillsForAgent(agentType) : getConnectedSkills();
  if (skills.length === 0) return '';

  const sections = skills.map((s, idx) => {
    const caps = s.capabilities.map((c) => `  - ${c}`).join('\n');
    const dirs = s.directives ? s.directives.map((d) => `  * ${d}`).join('\n') : '';
    return `${idx + 1}. **${s.name}** (${s.id}) [Version: ${s.version}]:\n  Summary: ${s.summary}\n  Capabilities:\n${caps}${dirs ? `\n  Directives:\n${dirs}` : ''}`;
  });

  return `\n\n# Active Connected Engineering & Domain Skills (${skills.length} Loaded)\nYou have direct access to these connected skills. Follow their directives and utilize their capabilities in your reasoning and tool execution:\n\n${sections.join('\n\n')}`;
};

export interface McpBundle {
  spec: string;
  generatedAt: string;
  servers: Array<{
    name: string;
    id: string;
    endpoint: string;
    version: string;
    capabilities: string[];
    config: Record<string, string>;
  }>;
}

export const buildMcpBundle = (skills: AgentSkill[], config: Record<string, Record<string, string>>): McpBundle => ({
  spec: 'carol-ann.mcp/v1',
  generatedAt: new Date().toISOString(),
  servers: skills.map((s) => ({
    name: s.name,
    id: s.id,
    endpoint: s.mcpEndpoint,
    version: s.version,
    capabilities: s.capabilities,
    config: config[s.id] ?? {},
  })),
});

export const exportStackBundle = (skillIds: string[], filename: string) => {
  const r = loadRegistry();
  const skills = AGENT_SKILLS.filter((s) => skillIds.includes(s.id));
  const bundle = buildMcpBundle(skills, r.config);
  downloadFile(filename, JSON.stringify(bundle, null, 2), 'application/json');
};
