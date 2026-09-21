import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateLocalFallback, runAnchorChat } from './inference.js';

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
});

describe('offline fallback honesty', () => {
  it('never invents staged actions, orders, or invoices', () => {
    for (const message of [
      'order my groceries',
      'invoice the client for $4500',
      'post a reel to instagram',
      'sync the lead to hubspot',
      'respond to the tripadvisor review',
      'book a salon appointment',
    ]) {
      const result = evaluateLocalFallback(message, 'carol-anchor', 'Carol Ann');
      expect(result.toolCall).toBeNull();
      expect(result.source).toBe('offline-unavailable');
      // Must not claim anything was done — the honest reply denies action.
      expect(result.reply).not.toMatch(/I have (staged|ordered|booked|sent|synced|executed|dispatched)/i);
      expect(result.reply).toMatch(/nothing was/i);
      expect(result.reply).toMatch(/offline|unavailable/i);
    }
  });

  it('runAnchorChat returns the honest fallback when Gemini is not configured', async () => {
    const result = await runAnchorChat('order my groceries', 'carol-anchor', 'Carol Ann', 'role', [], {}, '');
    expect(result.toolCall).toBeNull();
    expect(result.source).toBe('offline-unavailable');
    expect(result.reply).toMatch(/offline|unavailable/i);
  });
});
