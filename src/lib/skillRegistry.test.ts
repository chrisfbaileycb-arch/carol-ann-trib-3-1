import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadRegistry,
  connectSkill,
  disconnectSkill,
  toggleSkill,
  isSkillConnected,
  getConnectedSkills,
  getConnectedSkillsForAgent,
  connectAllEngineeringSkills,
  disconnectAllSkills,
  getSkillsDirectivesPrompt,
  saveRegistry,
} from './skillRegistry';
import { AGENT_SKILLS } from '@/data/skills';

describe('Skill Registry & Connection Engine', () => {
  beforeEach(() => {
    // Reset registry to empty or defaults
    saveRegistry({ installed: [], config: {} });
  });

  it('includes all 20 specialized engineering skills in the registry catalog', () => {
    const engineeringSkills = AGENT_SKILLS.filter((s) => s.category.startsWith('engineering-'));
    expect(engineeringSkills.length).toBe(20);

    const expectedIds = [
      'frontend-architecture',
      'fullstack-scaffolding',
      'adversarial-review',
      'tdd-vitest',
      'api-design-rest',
      'refactoring-decoupling',
      'database-modeling',
      'security-audit',
      'cicd-pipeline',
      'git-flow',
      'dockerization',
      'tailwind-styling',
      'accessibility-wcag',
      'state-management',
      'tech-docs-runbook',
      'multiagent-orchestration',
      'bug-triaging',
      'env-secrets-isolation',
      'performance-profiling',
      'mcp-server-builder',
    ];

    expectedIds.forEach((id) => {
      const found = AGENT_SKILLS.find((s) => s.id === id);
      expect(found).toBeDefined();
      expect(found?.capabilities.length).toBeGreaterThan(0);
      expect(found?.directives?.length).toBeGreaterThan(0);
    });
  });

  it('connects, disconnects, and toggles skills cleanly', () => {
    expect(isSkillConnected('tdd-vitest')).toBe(false);

    // Connect
    connectSkill('tdd-vitest');
    expect(isSkillConnected('tdd-vitest')).toBe(true);

    // Toggle off
    toggleSkill('tdd-vitest');
    expect(isSkillConnected('tdd-vitest')).toBe(false);

    // Toggle on
    toggleSkill('tdd-vitest');
    expect(isSkillConnected('tdd-vitest')).toBe(true);

    // Disconnect
    disconnectSkill('tdd-vitest');
    expect(isSkillConnected('tdd-vitest')).toBe(false);
  });

  it('connectAllEngineeringSkills connects all 20 engineering skills at once', () => {
    connectAllEngineeringSkills();
    const connected = getConnectedSkills();
    const engineeringConnected = connected.filter((s) => s.category.startsWith('engineering-'));
    expect(engineeringConnected.length).toBe(20);

    // Disconnect all
    disconnectAllSkills();
    expect(getConnectedSkills().length).toBe(0);
  });

  it('filters connected skills by agent role', () => {
    connectSkill('frontend-architecture'); // applicable to chat, coding, browser
    connectSkill('database-modeling');    // applicable to chat, coding
    connectSkill('security-audit');       // applicable to chat, coding, browser

    const codingSkills = getConnectedSkillsForAgent('coding');
    expect(codingSkills.some((s) => s.id === 'database-modeling')).toBe(true);
    expect(codingSkills.some((s) => s.id === 'frontend-architecture')).toBe(true);

    const browserSkills = getConnectedSkillsForAgent('browser');
    expect(browserSkills.some((s) => s.id === 'security-audit')).toBe(true);
    expect(browserSkills.some((s) => s.id === 'database-modeling')).toBe(false);
  });

  it('generates rich, structured prompt directives for connected skills', () => {
    connectSkill('tdd-vitest');
    connectSkill('security-audit');

    const prompt = getSkillsDirectivesPrompt('coding');
    expect(prompt).toContain('Active Connected Engineering & Domain Skills');
    expect(prompt).toContain('Test-Driven Development (TDD) & Vitest/Jest');
    expect(prompt).toContain('Security Audit & Secret Hardening');
    expect(prompt).toContain('Directives:');
    expect(prompt).toContain('Write tests verifying expected failures');
  });
});
