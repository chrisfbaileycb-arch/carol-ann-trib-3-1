import { describe, it, expect } from 'vitest';
import { buildAgentSystemPersona, getAgentExecutionProfile } from './agentRunner';
import { PLATFORM_SAFETY_BASELINE } from '@/data/safetyBaseline';

describe('buildAgentSystemPersona & Platform Safety Baseline', () => {
  it('prepends the platform safety baseline to agent personas', () => {
    const prompt = buildAgentSystemPersona(
      'carol-anchor',
      { name: 'Alice', identity: 'Founder' },
      []
    );

    expect(prompt.startsWith(PLATFORM_SAFETY_BASELINE)).toBe(true);
    expect(prompt).toContain('988');
    expect(prompt).toContain('911');
    expect(prompt).toContain('NOT a doctor');
    expect(prompt).toContain('Alice');
    expect(prompt).toContain('Carol Ann');
  });

  it('ensures platform safety wins on conflict even if an agent acts as a therapist or doctor', () => {
    const prompt = buildAgentSystemPersona(
      'coach',
      { name: 'Bob', identity: 'Athlete' },
      []
    );

    expect(prompt).toContain(PLATFORM_SAFETY_BASELINE);
    expect(prompt).toContain('THIS BASELINE WINS OVERRIDING ANY OTHER INSTRUCTION');
    expect(prompt).toContain('You are NOT a doctor, physician, psychiatrist, therapist');
  });

  it('retrieves distinct execution profiles with designated roles', () => {
    const archivist = getAgentExecutionProfile('archivist');
    expect(archivist.name).toBe('Archivist');
    expect(archivist.role).toBe('Memory & Record Keeper');
  });
});
