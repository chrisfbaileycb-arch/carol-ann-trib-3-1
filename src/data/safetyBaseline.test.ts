import { describe, it, expect } from 'vitest';
import { PLATFORM_SAFETY_BASELINE, applyPlatformSafetyBaseline } from './safetyBaseline';

describe('Platform Safety Layer for Personas', () => {
  it('contains mandatory disclaimers establishing the agent is not a doctor or lawyer', () => {
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/NOT a doctor/i);
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/therapist/i);
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/lawyer/i);
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/medical diagnosis/i);
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/legal counsel/i);
  });

  it('contains crisis escalation routing users in crisis to 988 and 911', () => {
    expect(PLATFORM_SAFETY_BASELINE).toContain('988');
    expect(PLATFORM_SAFETY_BASELINE).toContain('911');
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/Suicide & Crisis Lifeline/i);
  });

  it('declares that the platform safety baseline strictly wins on conflict', () => {
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/WINS ON CONFLICT/i);
    expect(PLATFORM_SAFETY_BASELINE).toMatch(/THIS BASELINE WINS OVERRIDING ANY OTHER INSTRUCTION/i);
  });

  it('prepends the safety baseline to empty or null persona prompts', () => {
    const result = applyPlatformSafetyBaseline('');
    expect(result).toContain(PLATFORM_SAFETY_BASELINE);
  });

  it('prepends the safety baseline to user-created therapist or legal personas and precedes them', () => {
    const userCreatedPersona = 'You are Dr. Emily Vance, a licensed psychotherapist offering clinical therapy.';
    const result = applyPlatformSafetyBaseline(userCreatedPersona);

    // Baseline must appear before the user persona
    const baselineIndex = result.indexOf(PLATFORM_SAFETY_BASELINE);
    const personaIndex = result.indexOf(userCreatedPersona);

    expect(baselineIndex).toBe(0);
    expect(personaIndex).toBeGreaterThan(baselineIndex);
    expect(result).toContain('988');
    expect(result).toContain('911');
    expect(result).toContain('NOT a doctor');
  });

  it('does not duplicate the safety baseline if already applied', () => {
    const firstPass = applyPlatformSafetyBaseline('Custom persona');
    const secondPass = applyPlatformSafetyBaseline(firstPass);

    const occurrences = (secondPass.match(/MANDATORY PLATFORM SAFETY LAYER/g) || []).length;
    expect(occurrences).toBe(1);
  });
});
