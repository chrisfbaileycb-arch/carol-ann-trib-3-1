import { auth } from './firebase';
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
}

export async function executeWorkflowOnBackend(
  action: HydrateFormAction,
  userId?: string | null,
): Promise<WorkflowExecutionResult> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await fetch('/api/workflow/execute', {
    method: 'POST',
    headers,
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
    throw new Error(errBody.error || `Workflow execution failed: ${res.statusText}`);
  }

  return res.json();
}

export async function executeCopilotStepOnBackend(
  taskId: string,
  stepIndex: number,
  actionName: string,
  url?: string,
  provider?: string,
  userId?: string | null,
): Promise<CopilotStepExecutionResult> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await fetch('/api/workflow/copilot/step', {
    method: 'POST',
    headers,
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
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await fetch('/api/workflow/sweep', {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: effectiveUserId }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Schedule sweep failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchWorkflowExecutionHistory(
  userId?: string | null,
): Promise<Array<Record<string, unknown>>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const effectiveUserId = userId || auth.currentUser?.uid || 'default';

  const res = await fetch(`/api/workflow/history?userId=${encodeURIComponent(effectiveUserId)}`, {
    headers,
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json().catch(() => ({ records: [] }));
  return data.records || [];
}
