import React from 'react';
import { Award, Shield, Star, X } from 'lucide-react';
import { getGameById } from '../data/esportsTitles';
import { formatCurrency } from '../engine/economy';
import { EsportsPlayer } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerProfileModalProps {
  player: EsportsPlayer;
  countryId: string;
  isRosterPlayer: boolean;
  energyLeft: number;
  negotiationCost: number;
  scoutingCost: number;
  hasDivision: boolean;
  onClose: () => void;
  onToggleStarter?: (playerId: string) => void;
  onSetCaptain?: (playerId: string) => void;
  onRenew?: (playerId: string) => void;
  onRelease?: (playerId: string) => void;
  onScout?: (playerId: string) => void;
  onStartNegotiation?: (player: EsportsPlayer) => void;
}

function getAttrColor(val: number): string {
  if (val >= 88) return 'text-emerald-400';
  if (val >= 76) return 'text-blue-400';
  if (val >= 62) return 'text-slate-200 dark:text-slate-200 text-slate-800';
  return 'text-amber-400';
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  countryId,
  isRosterPlayer,
  energyLeft,
  negotiationCost,
  scoutingCost,
  hasDivision,
  onClose,
  onToggleStarter,
  onSetCaptain,
  onRenew,
  onRelease,
  onScout,
  onStartNegotiation,
}) => {
  const game = getGameById(player.gameId);
  const revealed = isRosterPlayer || player.scouted;

  // 6-axis FM-style polygon radar
  const radarAxes = [
    { label: 'MECH', val: player.attributes.mechanicalSkill },
    { label: 'SENSE', val: player.attributes.gameSense },
    { label: 'COMMS', val: player.attributes.communication },
    { label: 'CONS', val: player.attributes.consistency },
    { label: 'MENT', val: player.attributes.mentalStrength },
    { label: 'ADAPT', val: player.attributes.adaptability },
  ];

  const cx = 100;
  const cy = 96;
  const maxR = 66;
  const polyPoints = radarAxes
    .map((ax, idx) => {
      const angle = (Math.PI * 2 * idx) / radarAxes.length - Math.PI / 2;
      const r = ((revealed ? ax.val : 55) / 100) * maxR;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl bg-white dark:bg-[#111723] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Athlete Profile Hero Header */}
        <div className="relative bg-gradient-to-r from-[#0F172A] via-[#172036] to-[#1E1B4B] p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player profile"
            className="absolute top-4 right-4 min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pr-10">
            <PlayerAvatar
              id={player.id}
              ign={player.ign}
              overall={revealed ? player.overall : undefined}
              size="xl"
              highlight={player.isCaptain}
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-blue-300 font-medium">
                <span>{game.name}</span>
                <span aria-hidden="true">·</span>
                <span>{player.role}</span>
                <span aria-hidden="true">·</span>
                <span>{player.tier}</span>
                {player.isCaptain && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300 font-semibold inline-flex items-center gap-1">
                      <Star size={12} /> Team Captain
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {player.ign}
              </h2>
              <div className="text-sm text-slate-300">
                {player.realName} · Age {player.age} · {player.nationality}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-slate-300 tabular-nums">
                <span>
                  OVR{' '}
                  <strong className="text-white text-sm">
                    {revealed ? player.overall : '??'}
                  </strong>
                </span>
                <span>
                  POT{' '}
                  <strong className="text-purple-300 text-sm">
                    {revealed ? player.attributes.potential : '??'}
                  </strong>
                </span>
                <span>
                  Trophies <strong className="text-amber-300">{player.trophies}</strong>
                </span>
                <span>
                  Salary{' '}
                  <strong className="text-emerald-300">
                    {formatCurrency(player.monthlySalaryUSD, countryId)}/mo
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body: Radar + Attribute Matrix */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Radar Chart */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800/80">
              <svg viewBox="0 0 200 192" className="w-48 h-44" role="img" aria-label="Player attribute radar">
                {[0.33, 0.66, 1].map((ring) => {
                  const ringPts = radarAxes
                    .map((_, idx) => {
                      const angle = (Math.PI * 2 * idx) / radarAxes.length - Math.PI / 2;
                      return `${cx + Math.cos(angle) * maxR * ring},${cy + Math.sin(angle) * maxR * ring}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={ring}
                      points={ringPts}
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                  );
                })}
                {radarAxes.map((ax, idx) => {
                  const angle = (Math.PI * 2 * idx) / radarAxes.length - Math.PI / 2;
                  const x2 = cx + Math.cos(angle) * maxR;
                  const y2 = cy + Math.sin(angle) * maxR;
                  const lx = cx + Math.cos(angle) * (maxR + 17);
                  const ly = cy + Math.sin(angle) * (maxR + 14);
                  return (
                    <g key={ax.label}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-500 dark:fill-slate-400 text-[9px] font-mono font-semibold"
                      >
                        {ax.label}
                      </text>
                    </g>
                  );
                })}
                <polygon
                  points={polyPoints}
                  fill="rgba(59, 130, 246, 0.28)"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
              </svg>
              {!revealed && (
                <div className="text-[11px] text-amber-500 font-medium mt-1">
                  Scout player to unlock exact telemetry
                </div>
              )}
            </div>

            {/* 3-Column FM Attribute Table */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  Technical
                </div>
                {[
                  { label: 'Mechanical', val: player.attributes.mechanicalSkill },
                  { label: 'Consistency', val: player.attributes.consistency },
                  { label: 'Adaptability', val: player.attributes.adaptability },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className={`font-mono font-bold tabular-nums ${revealed ? getAttrColor(row.val) : 'text-slate-500'}`}>
                      {revealed ? row.val : '??'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  Tactical
                </div>
                {[
                  { label: 'Game Sense', val: player.attributes.gameSense },
                  { label: 'Comms', val: player.attributes.communication },
                  { label: 'Experience', val: player.attributes.experience },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className={`font-mono font-bold tabular-nums ${revealed ? getAttrColor(row.val) : 'text-slate-500'}`}>
                      {revealed ? row.val : '??'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  Mental &amp; Pro
                </div>
                {[
                  { label: 'Mental Str.', val: player.attributes.mentalStrength },
                  { label: 'Discipline', val: player.attributes.discipline },
                  { label: 'Reputation', val: player.attributes.reputation },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className={`font-mono font-bold tabular-nums ${revealed ? getAttrColor(row.val) : 'text-slate-500'}`}>
                      {revealed ? row.val : '??'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contract & Morale Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block">Morale</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {player.morale}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Match Form</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {player.form}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Contract Term</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {isRosterPlayer ? `${player.contractWeeksLeft} wks left` : 'Free Agent'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Buyout Clause</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(player.buyoutUSD, countryId, true)}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {isRosterPlayer ? (
              <>
                {onToggleStarter && (
                  <button
                    type="button"
                    onClick={() => onToggleStarter(player.id)}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold ${
                      player.isStarter
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {player.isStarter ? 'Active Starter' : 'Move to Starters'}
                  </button>
                )}
                {onSetCaptain && (
                  <button
                    type="button"
                    disabled={player.isCaptain}
                    onClick={() => onSetCaptain(player.id)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-semibold"
                  >
                    {player.isCaptain ? 'Captain' : 'Appoint Captain'}
                  </button>
                )}
                {onRenew && (
                  <button
                    type="button"
                    disabled={energyLeft < negotiationCost}
                    onClick={() => onRenew(player.id)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Renew Contract (-{negotiationCost} EN)
                  </button>
                )}
                {onRelease && (
                  <button
                    type="button"
                    onClick={() => {
                      onRelease(player.id);
                      onClose();
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10"
                  >
                    Release Player
                  </button>
                )}
              </>
            ) : (
              <>
                {!player.scouted && onScout && (
                  <button
                    type="button"
                    disabled={energyLeft < scoutingCost}
                    onClick={() => onScout(player.id)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 disabled:opacity-40 text-xs font-semibold"
                  >
                    Scout Report (-{scoutingCost} EN)
                  </button>
                )}
                {onStartNegotiation && (
                  <button
                    type="button"
                    disabled={!hasDivision}
                    onClick={() => {
                      onStartNegotiation(player);
                      onClose();
                    }}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-35 text-white text-xs font-semibold"
                  >
                    {hasDivision ? 'Open Contract Negotiation' : 'Open Division First'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
