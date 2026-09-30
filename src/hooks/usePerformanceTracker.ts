import { useEffect, useState } from 'react';
import { performanceTracker, type PerformanceSnapshot } from '@/lib/performanceTracker';

export function usePerformanceTracker(): PerformanceSnapshot {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(() => performanceTracker.getSnapshot());

  useEffect(() => {
    return performanceTracker.subscribe((latest) => {
      setSnapshot(latest);
    });
  }, []);

  return snapshot;
}
