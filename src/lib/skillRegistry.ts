import { AGENT_SKILLS, AGENT_STACKS, type AgentSkill } from '@/data/skills';
import { KEYS, read, write, downloadFile } from './memoryStore';

export interface SkillInstallState {
  installed: string[];
  config: Record<string, Record<string, string>>;
}

const defaults = (): SkillInstallState => ({
  installed: AGENT_SKILLS.filter((s) => s.installedByDefault).map((s) => s.id),
  config: {},
});

export const loadRegistry = (): SkillInstallState => {
  const r = read<SkillInstallState>(KEYS.skills, defaults());
  return { installed: r.installed ?? [], config: r.config ?? {} };
};

export const saveRegistry = (r: SkillInstallState) => write(KEYS.skills, r);

export const toggleSkill = (id: string): SkillInstallState => {
  const r = loadRegistry();
  const next = r.installed.includes(id)
    ? { ...r, installed: r.installed.filter((s) => s !== id) }
    : { ...r, installed: [...r.installed, id] };
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
  spec: 'maggie.mcp/v1',
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
