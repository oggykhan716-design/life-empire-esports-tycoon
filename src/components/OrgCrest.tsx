import React from 'react';
import { Award, Crown, Flame, Shield, Target, Zap } from 'lucide-react';

interface OrgCrestProps {
  name: string;
  tag: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OrgCrest: React.FC<OrgCrestProps> = ({
  name,
  tag,
  color,
  icon = 'shield',
  size = 'md',
}) => {
  const dims =
    size === 'sm' ? 'w-9 h-9 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-sm' : 'w-11 h-11 text-xs';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 19;

  const renderGlyph = () => {
    switch (icon) {
      case 'crown':
        return <Crown size={iconSize} strokeWidth={2} />;
      case 'flame':
        return <Flame size={iconSize} strokeWidth={2} />;
      case 'zap':
        return <Zap size={iconSize} strokeWidth={2} />;
      case 'target':
        return <Target size={iconSize} strokeWidth={2} />;
      case 'award':
        return <Award size={iconSize} strokeWidth={2} />;
      default:
        return <Shield size={iconSize} strokeWidth={2} />;
    }
  };

  return (
    <div
      className={`${dims} rounded-xl flex flex-col items-center justify-center shrink-0 font-display font-bold text-white shadow-sm select-none`}
      style={{ backgroundColor: color || '#2563EB' }}
      title={`${name} (${tag})`}
      aria-label={`${name} crest`}
    >
      {renderGlyph()}
    </div>
  );
};
