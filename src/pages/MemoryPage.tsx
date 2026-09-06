import React from 'react';
import { SovereignMemoryLedger } from '@/components/workspace/SovereignMemoryLedger';
import { useCarol } from '@/contexts/CarolContext';

/** Dedicated /memory route — sovereign memory ledger with search, categories, export and wipe. */
const MemoryPage: React.FC = () => {
  const { profile } = useCarol();
  return (
    <div className="h-screen bg-[#101118]">
      <SovereignMemoryLedger profile={profile} />
    </div>
  );
};

export default MemoryPage;
