import { describe, it, expect, beforeEach } from 'vitest';
import { performanceTracker } from './performanceTracker';

describe('PerformanceTrackerEngine', () => {
  beforeEach(() => {
    performanceTracker.clearMetrics();
  });

  it('tracks agent call latency and TTFT properly', () => {
    const callId = 'test_call_1';
    performanceTracker.startAgentCall(callId, 'carol', 'Carol Ann', 'Grocery Order');

    const snap1 = performanceTracker.getSnapshot();
    expect(snap1.totalAgentCalls).toBe(1);
    expect(snap1.recentAgentCalls[0].status).toBe('pending');

    performanceTracker.recordTtft(callId);
    performanceTracker.endAgentCall(callId, { success: true });

    const snap2 = performanceTracker.getSnapshot();
    expect(snap2.recentAgentCalls[0].status).toBe('success');
    expect(snap2.recentAgentCalls[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(snap2.recentAgentCalls[0].ttftMs).toBeDefined();
  });

  it('tracks background tasks properly', () => {
    const taskId = 'bg_task_1';
    performanceTracker.startBackgroundTask(taskId, 'DOM Automation Pipeline');

    let snap = performanceTracker.getSnapshot();
    expect(snap.activeBackgroundTasksCount).toBe(1);
    expect(snap.activeBackgroundTasks[0].status).toBe('running');

    performanceTracker.endBackgroundTask(taskId, 'completed');

    snap = performanceTracker.getSnapshot();
    expect(snap.activeBackgroundTasks[0].status).toBe('completed');
  });

  it('records main-thread hitches and adjusts responsiveness score', () => {
    const initialScore = performanceTracker.getResponsivenessScore();
    expect(initialScore).toBeGreaterThanOrEqual(90);

    // Record a major hitch
    performanceTracker.recordHitch(150);

    const snap = performanceTracker.getSnapshot();
    expect(snap.recentHitches.length).toBe(1);
    expect(snap.recentHitches[0].severity).toBe('major');
    expect(snap.responsivenessScore).toBeLessThan(initialScore);
  });

  it('calculates average and P95 latency accurately', async () => {
    await performanceTracker.measureAgentCall('coach', 'Coach', 'Workout Plan', async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 'ok';
    });

    const snap = performanceTracker.getSnapshot();
    expect(snap.averageLatencyMs).toBeGreaterThanOrEqual(15);
    expect(snap.p95LatencyMs).toBeGreaterThanOrEqual(15);
  });
});
