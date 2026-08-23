import React from 'react';
import * as Lucide from 'lucide-react';

export interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

/** Renders a lucide icon by string name with a safe fallback. */
export const Icon: React.FC<IconProps> = ({ name, className = 'h-4 w-4', strokeWidth = 2 }) => {
  const registry = Lucide as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>;
  const Cmp = registry[name] ?? Lucide.Circle;
  return <Cmp className={className} strokeWidth={strokeWidth} />;
};

export default Icon;
