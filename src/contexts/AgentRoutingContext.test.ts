import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectRoleType,
  DEFAULT_UI_COMPONENT,
  DEFAULT_SYSTEMS_ENDPOINT,
  DEFAULT_SCHEMA_SQL,
} from './AgentRoutingContext';
import { AGENT_PRESETS } from '@/data/agents';

describe('Agent Routing & Persona State', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('correctly classifies UI/Frontend agents vs Systems agents', () => {
    // UI / Frontend agents
    expect(detectRoleType({ category: 'design', role: 'UI Stylist', name: 'Tailwind Agent' })).toBe('ui');
    expect(detectRoleType({ role: 'Frontend Architect', name: 'React Specialist' })).toBe('ui');

    // Systems / Infrastructure agents
    expect(detectRoleType({ category: 'cloud-infra', role: 'Cloud Architect', name: 'Infra Bot' })).toBe('systems');
    expect(detectRoleType({ role: 'Backend Systems Engineer', name: 'Systems Guardian' })).toBe('systems');
    expect(detectRoleType({ role: 'Database & SQL Specialist', name: 'Prisma DB' })).toBe('systems');
  });

  it('provides clean default templates for UI and Systems agents', () => {
    // UI Component template has Tailwind classes and React export
    expect(DEFAULT_UI_COMPONENT).toContain("import React, { useState, useEffect } from 'react';");
    expect(DEFAULT_UI_COMPONENT).toContain('const [pulseEnabled, setPulseEnabled] = useState(true);');
    expect(DEFAULT_UI_COMPONENT).toContain('useEffect');
    expect(DEFAULT_UI_COMPONENT).toContain('className=');
    expect(DEFAULT_UI_COMPONENT).toContain('SovereignExecutiveDeck');

    // Systems Endpoint template enforces Bearer token auth, 401 fail-closed guard, and Zod
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('AUTH_BEARER_MISSING');
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('WorkflowTaskSchema');
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('isMock');
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('badge: isMock ? \'DEMO\' : \'LIVE\'');
  });

  it('verifies non-negotiable honesty receipts in systems endpoint template', () => {
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('Simulated — nothing was dispatched to production');
    expect(DEFAULT_SYSTEMS_ENDPOINT).toContain('SIM-');
  });
});
