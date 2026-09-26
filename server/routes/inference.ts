import type { Express } from 'express';
import { requireFirebaseAuth, verifyAppCheck } from '../middleware/auth.js';
import { runAnchorChat } from '../lib/inference.js';

export function registerInferenceRoutes(app: Express) {
// Conversational Inference Route (requires Firebase Authentication)
app.post('/api/gemini/chat', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const {
      message,
      agentId = 'carol-anchor',
      agentName = 'Carol Ann',
      agentRole = 'Warm Anchor & Workspace Orchestrator',
      systemPersona = '',
      memoryPartition = '',
      history = [],
      profile = {},
      memoryContext = '',
      attachments = [],
    } = req.body;

    if (!message && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachments required.' });
    }

    let fullMessage = message || '';
    if (Array.isArray(attachments) && attachments.length > 0) {
      const attachmentSummaries = attachments
        .map((att: { type?: string; name?: string; size?: string; contextSnippet?: string; connectorName?: string }) => {
          if (att.type === 'image') return `[Attached Photo: ${att.name || 'Image'} (${att.size || 'image'})]`;
          if (att.type === 'video') return `[Attached Video: ${att.name || 'Video'} (${att.size || 'video'})]`;
          if (att.type === 'file') return `[Attached Document/File: ${att.name || 'File'} (${att.size || 'document'})]`;
          if (att.type === 'connector') return `[Attached MCP Connector: ${att.connectorName || att.name || 'Connector'}]`;
          if (att.type === 'context') return `[Attached Workspace Context: ${att.name || 'Context'}\n${att.contextSnippet || ''}]`;
          return `[Attached: ${att.name || 'Item'}]`;
        })
        .join('\n');

      fullMessage = fullMessage ? `${fullMessage}\n\nAttachments & Attached Context:\n${attachmentSummaries}` : `Attachments:\n${attachmentSummaries}`;
    }

    const result = await runAnchorChat(
      fullMessage,
      agentId,
      agentName,
      agentRole,
      history,
      profile,
      memoryContext,
      systemPersona,
      memoryPartition
    );
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal inference error',
    });
  }
});

// Agent dispatch route — plans and routes a task to the right specialist
// (requires Firebase Authentication)
app.post('/api/agent/dispatch', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const { task, agentId = 'carol-anchor', agentName = 'Carol Ann', history = [], profile = {}, memoryContext = '' } = req.body;
    if (!task) {
      return res.status(400).json({ error: 'Task description is required.' });
    }

    const result = await runAnchorChat(
      `Dispatch this task to the right specialist and outline a plan: ${task}`,
      agentId,
      agentName,
      'Warm Anchor & Workspace Orchestrator',
      history,
      profile,
      memoryContext,
    );

    return res.json({
      ...result,
      dispatched: true,
      task,
    });
  } catch (error) {
    console.error('Error in /api/agent/dispatch:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Dispatch error',
    });
  }
});

}
