import React, { useState } from 'react';
import { User } from 'lucide-react';

import portraitAlpha from '../assets/images/player_portrait_alpha_1794780501464.jpg';
import portraitBeta from '../assets/images/player_portrait_beta_1794780501753.jpg';
import portraitGamma from '../assets/images/player_portrait_gamma_1794780502510.jpg';

interface PlayerAvatarProps {
  id: string;
  ign: string;
  overall?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
}

const PORTRAIT_ASSETS = [portraitAlpha, portraitBeta, portraitGamma];

function hashIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % PORTRAIT_ASSETS.length;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  id,
  ign,
  overall,
  size = 'md',
  highlight = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = PORTRAIT_ASSETS[hashIndex(id + ign)];

  const dims =
    size === 'sm'
      ? 'w-10 h-10 rounded-lg'
      : size === 'lg'
      ? 'w-16 h-16 rounded-xl'
      : size === 'xl'
      ? 'w-24 h-24 rounded-2xl'
      : 'w-12 h-12 rounded-xl';

  return (
    <div
      className={`${dims} relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-800 to-[#0B0E14] ${
        highlight
          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
          : 'ring-1 ring-slate-300/60 dark:ring-slate-700/80'
      }`}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt={`${ign} athlete portrait`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          <User size={size === 'xl' ? 32 : 18} />
        </div>
      )}
      {overall !== undefined && (size === 'lg' || size === 'xl') && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#0B0E14]/85 text-[10px] font-mono font-bold text-blue-400 border border-blue-500/40 tabular-nums">
          {overall}
        </div>
      )}
    </div>
  );
};
