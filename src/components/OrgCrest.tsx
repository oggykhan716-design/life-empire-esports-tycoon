import React from 'react';
import { Award, Crown, Flame, Shield, Target, Zap } from 'lucide-react';

interface OrgCrestProps {
  name: string;
  tag: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const OrgCrest: React.FC<OrgCrestProps> = ({
  name,
  tag,
  color,
  icon = 'shield',
  size = 'md',
}) => {
  const dims =
    size === 'sm'
      ? 'w-9 h-9 text-[9px]'
      : size === 'lg'
      ? 'w-14 h-14 text-xs'
      : size === 'xl'
      ? 'w-16 h-16 text-sm'
      : 'w-11 h-11 text-[10px]';

  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 22 : size === 'xl' ? 26 : 18;
  const baseColor = color || '#2563EB';

  const renderGlyph = () => {
    switch (icon) {
      case 'crown':
        return <Crown size={iconSize} strokeWidth={2.2} />;
      case 'flame':
        return <Flame size={iconSize} strokeWidth={2.2} />;
      case 'zap':
        return <Zap size={iconSize} strokeWidth={2.2} />;
      case 'target':
        return <Target size={iconSize} strokeWidth={2.2} />;
      case 'award':
        return <Award size={iconSize} strokeWidth={2.2} />;
      default:
        return <Shield size={iconSize} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className={`${dims} relative rounded-xl flex flex-col items-center justify-center shrink-0 font-display font-extrabold text-white select-none overflow-hidden ring-1 ring-white/20 shadow-md`}
      style={{
        background: `linear-gradient(145deg, ${baseColor}, #0B101B 135%)`,
      }}
      title={`${name} (${tag})`}
      aria-label={`${name} crest`}
    >
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.65), transparent 60%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        {renderGlyph()}
        {(size === 'lg' || size === 'xl') && (
          <span className="font-mono text-[9px] font-bold tracking-wider mt-0.5 opacity-95">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
};
