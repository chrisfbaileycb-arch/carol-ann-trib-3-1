
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { AgentRoutingProvider } from '@/contexts/AgentRoutingContext';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AgentRoutingProvider>
        <AppLayout />
      </AgentRoutingProvider>
    </AppProvider>
  );
};

export default Index;
