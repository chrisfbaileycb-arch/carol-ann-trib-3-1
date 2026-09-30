import { auth } from './firebase';
import { apiFetch } from './apiClient';
import { performanceTracker } from './performanceTracker';
import type { HydrateFormAction, ErrandTask } from '@/data/schemas';

export interface WorkflowExecutionResult {
  ok: boolean;
  status: string;
  executionId: string;
  receiptId: string;
  details: string;
  errand?: ErrandTask;
  backend: string;
  databaseId?: string;
  timestamp: string;
  isMock?: boolean;
  badge?: string;
}

export interface CopilotStepExecutionResult {
  ok: boolean;
  status: string;
  step: {
    id: string;
    taskId: string;
    stepIndex: number;
    actionName: string;
    status: string;
    output: string;
    timestamp: string;
  };
  output: string;
  isMock?: boolean;
  badge?: string;
}

export async function executeWorkflowOnBackend(
  action: HydrateFormAction,
  userId?: string | null,
): Promise<WorkflowExecutionResult> {
  const effectiveUserId = userId || auth.currentUser?.uid || 'default';
  const taskId = `exec_${action.id}_${Date.now()}`;
  performanceTracker.startBackgroundTask(taskId, `Workflow: ${action.action_name}`);

  try {
    const res = await apiFetch('/api/workflow/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        actionId: action.id,
        category: action.category,
        actionName: action.action_name,
        targetApp: action.target_app,
        formPayload: action.form_payload,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      performanceTracker.endBackgroundTask(taskId, 'failed');
      throw new Error(errBody.error || `Workflow execution failed: ${res.statusText}`);
    }

    const data = await res.json();
    performanceTracker.endBackgroundTask(taskId, 'completed');
    return data;
  } catch (err) {
    performanceTracker.endBackgroundTask(taskId, 'failed');
    throw err;
  }
}

export async function executeCopilotStepOnBackend(
  taskId: string,
  stepIndex: number,
  actionName: string,
  url?: string,
  provider?: string,
  userId?: string | null,
): Promise<CopilotStepExecutionResult> {
  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await apiFetch('/api/workflow/copilot/step', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: effectiveUserId,
      taskId,
      stepIndex,
      actionName,
      url,
      provider,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Copilot step execution failed: ${res.statusText}`);
  }

  return res.json();
}

export async function triggerBackendScheduleSweep(
  userId?: string | null,
): Promise<{ ok: boolean; sweptCount: number; commands: Array<Record<string, unknown>> }> {
  const effectiveUserId = userId || auth.currentUser?.uid || 'default';
  const taskId = `sweep_${Date.now()}`;
  performanceTracker.startBackgroundTask(taskId, 'Scheduled Command Cron Sweep');

  try {
    const res = await apiFetch('/api/workflow/sweep', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: effectiveUserId }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      performanceTracker.endBackgroundTask(taskId, 'failed');
      throw new Error(errBody.error || `Schedule sweep failed: ${res.statusText}`);
    }

    const data = await res.json();
    performanceTracker.endBackgroundTask(taskId, 'completed');
    return data;
  } catch (err) {
    performanceTracker.endBackgroundTask(taskId, 'failed');
    throw err;
  }
}

export async function fetchWorkflowExecutionHistory(
  userId?: string | null,
): Promise<Array<Record<string, unknown>>> {
  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await apiFetch(`/api/workflow/history?userId=${encodeURIComponent(effectiveUserId)}`);

  if (!res.ok) {
    return [];
  }

  const data = await res.json().catch(() => ({ records: [] }));
  return data.records || [];
}
