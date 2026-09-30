import type { Express } from 'express';
import { optionalFirebaseAuth, requireFirebaseAuth, verifyAppCheck } from '../middleware/auth.ts';
import { runAnchorChat } from '../lib/inference.ts';

export function registerInferenceRoutes(app: Express) {
// Conversational Inference Route (supports authenticated & workspace sessions)
app.post('/api/gemini/chat', optionalFirebaseAuth, verifyAppCheck, async (req, res) => {
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
      workspaceContext,
      connectedSkills = [],
    } = req.body;

    if (!message && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachments required.' });
    }

    let fullMessage = message || '';
    if (Array.isArray(attachments) && attachments.length > 0) {
      const attachmentSummaries = attachments
        .map((att: {
          type?: string;
          name?: string;
          size?: string;
          contextSnippet?: string;
          connectorName?: string;
          skillName?: string;
          skillCategory?: string;
          skillSummary?: string;
          directives?: string[];
        }) => {
          if (att.type === 'image') return `[Attached Photo: ${att.name || 'Image'} (${att.size || 'image'})]`;
          if (att.type === 'video') return `[Attached Video: ${att.name || 'Video'} (${att.size || 'video'})]`;
          if (att.type === 'file') return `[Attached Document/File: ${att.name || 'File'} (${att.size || 'document'})]`;
          if (att.type === 'connector') return `[Attached MCP Connector: ${att.connectorName || att.name || 'Connector'}]`;
          if (att.type === 'context') return `[Attached Workspace Context: ${att.name || 'Context'}\n${att.contextSnippet || ''}]`;
          if (att.type === 'skill') {
            return `[Connected Skill: ${att.skillName || att.name || 'Skill'}\nCategory: ${att.skillCategory || 'General'}\nSummary: ${att.skillSummary || ''}\n${Array.isArray(att.directives) && att.directives.length > 0 ? `Directives:\n${att.directives.map((d: string) => `* ${d}`).join('\n')}` : ''}]`;
          }
          return `[Attached: ${att.name || 'Item'}]`;
        })
        .join('\n');

      fullMessage = fullMessage ? `${fullMessage}\n\nAttachments & Attached Context:\n${attachmentSummaries}` : `Attachments:\n${attachmentSummaries}`;
    }

    let finalSystemPersona = systemPersona;
    if (workspaceContext && typeof workspaceContext === 'object') {
      const { errands, tools, notes } = workspaceContext;
      const wsSnippet = [
        '\n\n# Active Workspace Context',
        errands ? `## Errands:\n${errands}` : '',
        tools ? `## Tools & Connectors:\n${tools}` : '',
        notes ? `## Notes & Scratchpad:\n${notes}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      finalSystemPersona = `${systemPersona}${wsSnippet}`;
    }

    if (Array.isArray(connectedSkills) && connectedSkills.length > 0) {
      const skillsSnippet = `\n\n# Active Connected Skills (${connectedSkills.length} Enabled)\nYou must operate with adherence to these connected skills and engineering disciplines:\n- ${connectedSkills.join('\n- ')}`;
      finalSystemPersona = `${finalSystemPersona}${skillsSnippet}`;
    }

    const result = await runAnchorChat(
      fullMessage,
      agentId,
      agentName,
      agentRole,
      history,
      profile,
      memoryContext,
      finalSystemPersona,
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
