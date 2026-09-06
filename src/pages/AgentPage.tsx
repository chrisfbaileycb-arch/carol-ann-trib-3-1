import React from 'react';
import { useNavigate } from 'react-router-dom';
import AgentStudio from '@/components/agents/AgentStudio';

/** Dedicated /agent route — agent studio with creation, tuning, memory erase and personality controls. */
const AgentPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen bg-[#101118]">
      <AgentStudio
        onOpenChat={(agentId) => {
          // Return to the workspace chat with the chosen agent pre-selected.
          navigate(`/?agent=${encodeURIComponent(agentId)}`);
        }}
      />
    </div>
  );
};

export default AgentPage;
