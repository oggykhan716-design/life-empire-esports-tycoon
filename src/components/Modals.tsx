import React, { useState } from 'react';
import { Download, Save, Swords, Trophy, Upload, X } from 'lucide-react';
import { getGameById } from '../data/esportsTitles';
import { formatCurrency } from '../engine/economy';
import { computeTeamRating, estimateWinProbability } from '../engine/matchEngine';
import { SaveSlotSummary } from '../engine/storage';
import { pickOpponentForMatch } from '../engine/tournamentEngine';
import {
  ActiveTournament,
  EndingSummary,
  GameState,
  MatchReport,
  MatchStrategy,
} from '../types/game';
import { OrgCrest } from './OrgCrest';

/* -------------------------------------------------------------------------- */
/* 1. Story Event Modal                                                       */
/* -------------------------------------------------------------------------- */
interface EventModalProps {
  state: GameState;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ state, onChoose, onClose }) => {
  const evt = state.pendingEvent;
  if (!evt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#111723] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-blue-500">
              {evt.category} Dispatch · Week {state.week}
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {evt.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Defer event"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{evt.description}</p>

        <div className="space-y-2.5">
          {evt.choices.map((c) => {
            const cantAffordPersonal =
              c.costCashUSD !== undefined && state.finances.cashUSD < c.costCashUSD;
            const cantAffordOrg =
              c.costOrgUSD !== undefined && state.org.bankBalanceUSD < c.costOrgUSD;
            const disabled = cantAffordPersonal || cantAffordOrg;

            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => onChoose(c.id)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] hover:border-blue-500 disabled:opacity-40 transition-colors space-y-1"
              >
                <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  {c.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{c.detail}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Tactical Matchday Room Modal                                            */
/* -------------------------------------------------------------------------- */
interface MatchModalProps {
  state: GameState;
  tournament: ActiveTournament;
  onSimulate: (
    tournament: ActiveTournament,
    opponent: { id: string; name: string; strength: number },
    strategy: MatchStrategy
  ) => MatchReport;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  state,
  tournament,
  onSimulate,
  onClose,
}) => {
  const [opponent] = useState(() => pickOpponentForMatch(tournament, state.rivals));
  const [report, setReport] = useState<MatchReport | null>(null);

  const game = getGameById(tournament.gameId);
  const division = state.org.divisions.find((d) => d.gameId === tournament.gameId);
  const starters = state.roster.filter((p) => p.gameId === tournament.gameId && p.isStarter);
  const teamRating = division ? computeTeamRating(starters, division, state) : 50;
  const estWinPct = estimateWinProbability(teamRating, opponent.strength, 'balanced');
  const hasCoach = state.org.staff.some((s) => s.roleId === 'head_coach');

  const rivalMatch = state.rivals.find((r) => r.id === opponent.id);
  const oppColor = rivalMatch?.color ?? '#475569';
  const oppTag = rivalMatch?.tag ?? opponent.name.slice(0, 3).toUpperCase();

  const strategies: { id: MatchStrategy; label: string; desc: string }[] = [
    { id: 'aggressive', label: '1. Aggressive Execution', desc: 'High-tempo pressure; wider upset swing.' },
    { id: 'defensive', label: '2. Defensive Approach', desc: 'Disciplined setups and controlled economy.' },
    { id: 'target_weakest', label: '3. Target Weakest Opponent', desc: 'Exploit their lowest-rated lane.' },
    { id: 'balanced', label: '4. Balanced Strategy', desc: 'Adapt mid-match based on momentum.' },
    {
      id: 'coach_decide',
      label: '5. Allow Coach to Decide',
      desc: hasCoach ? 'Head Coach tactical edge active.' : 'Auto-select situational gameplan.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-white dark:bg-[#111723] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Matchday Top Broadcast Bar */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#172036] to-[#1E1B4B] p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close match modal"
            className="absolute top-4 right-4 min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>

          <div className="text-xs font-medium text-blue-300 mb-4">
            {tournament.tier} · {game.name} · Round {tournament.round}/{tournament.maxRounds}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <OrgCrest
                name={state.org.name}
                tag={state.org.tag}
                color={state.org.color}
                icon={state.org.icon}
                size="lg"
              />
              <div className="min-w-0">
                <div className="font-display font-bold text-base truncate">{state.org.name}</div>
                <div className="font-mono text-xs text-blue-300">OVR {Math.round(teamRating)}</div>
              </div>
            </div>

            <div className="font-mono text-lg font-extrabold px-3 py-1 rounded-lg bg-white/10 shrink-0">
              {report ? report.scoreLine : 'VS'}
            </div>

            <div className="flex items-center gap-3 min-w-0 text-right">
              <div className="min-w-0">
                <div className="font-display font-bold text-base truncate">{opponent.name}</div>
                <div className="font-mono text-xs text-purple-300">STR {opponent.strength}</div>
              </div>
              <OrgCrest name={opponent.name} tag={oppTag} color={oppColor} size="lg" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {!report ? (
            <>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-500">Win Forecast: {estWinPct}%</span>
                  <span className="font-mono text-emerald-500 font-semibold">
                    Prize Pool {formatCurrency(tournament.prizePoolUSD, state.character.countryId, true)}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${estWinPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Matchday Tactical Approach
                </div>
                {strategies.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setReport(onSimulate(tournament, opponent, st.id))}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] hover:border-blue-500 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                        {st.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{st.desc}</div>
                    </div>
                    <Swords size={16} className="text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-display font-bold uppercase ${
                    report.won ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {report.won ? 'Victory Secured' : 'Match Defeat'} · Map: {report.mapName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500">Match MVP</div>
                  <div className="font-display font-bold text-sm mt-0.5 text-amber-500">
                    {report.mvpIgn} ({report.mvpRating})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Org Payout</div>
                  <div className="font-mono font-bold text-sm text-emerald-500 mt-0.5">
                    +{formatCurrency(report.prizeWonUSD, state.character.countryId)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Reputation</div>
                  <div className="font-mono font-bold text-sm mt-0.5">
                    {report.reputationDelta >= 0 ? `+${report.reputationDelta}` : report.reputationDelta}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.narrative.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500">Player Box Score</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {report.playerStats.map((ps) => (
                    <div
                      key={ps.ign}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 flex justify-between"
                    >
                      <span>{ps.ign}</span>
                      <strong className="text-blue-500">{ps.rating}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold"
              >
                Return to Tournament Bracket
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Save / Load Manager Modal                                               */
/* -------------------------------------------------------------------------- */
interface SaveModalProps {
  state: GameState;
  saves: SaveSlotSummary[];
  onSaveSlot: (slotId: string) => void;
  onLoadSlot: (slotId: string) => void;
  onNewCareer: () => void;
  onImportJson: (raw: string) => void;
  onClose: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  state,
  saves,
  onSaveSlot,
  onLoadSlot,
  onNewCareer,
  onImportJson,
  onClose,
}) => {
  const [importText, setImportText] = useState('');

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-empire-${state.character.lastName.toLowerCase()}-wk${state.week}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#111723] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Save &amp; Career Slots
          </h3>
          <button type="button" onClick={onClose} className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400">
            <X size={18} />
          </button>
        </div>

        {state.isSandbox && (
          <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-600/10 text-xs text-purple-300 space-y-1">
            <div className="font-semibold text-purple-200">Sandbox Mode Active · Isolated Save</div>
            <p className="text-slate-300">
              Sandbox Mode automatically saves to its own isolated storage and never modifies your normal career slots. You can load a career save below to return to normal progression.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {(['slot_1', 'slot_2', 'slot_3'] as const).map((slotId, idx) => {
            const existing = saves.find((s) => s.slotId === slotId);
            return (
              <div
                key={slotId}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-display font-semibold text-sm">
                    Career Slot {idx + 1} {!state.isSandbox && state.saveSlotId === slotId && '(Active)'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {existing
                      ? `${existing.characterName} · Yr ${existing.year} Wk ${existing.week}`
                      : 'Empty slot'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!state.isSandbox && (
                    <button
                      type="button"
                      onClick={() => onSaveSlot(slotId)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Save size={13} />
                      Save
                    </button>
                  )}
                  {existing && (
                    <button
                      type="button"
                      onClick={() => {
                        onLoadSlot(slotId);
                        onClose();
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Load
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => {
                onNewCareer();
                onClose();
              }}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold"
            >
              Start New Career
            </button>
          </div>

          <div className="space-y-1.5">
            <textarea
              rows={2}
              placeholder="Paste exported career JSON here to import..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono"
            />
            {importText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onImportJson(importText);
                  setImportText('');
                  onClose();
                }}
                className="w-full min-h-[40px] rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Upload size={14} />
                Import Career JSON
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Ending Summary Modal                                                    */
/* -------------------------------------------------------------------------- */
interface EndingModalProps {
  ending: EndingSummary;
  onContinuePlaying: () => void;
  onNewCareer: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  ending,
  onContinuePlaying,
  onNewCareer,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#111723] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-500">
          <Trophy size={28} />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">
            Legacy Achieved · Week {ending.achievedWeek}
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {ending.title}
          </h2>
          <div className="text-sm font-medium text-blue-500">{ending.subtitle}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {ending.summary}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onContinuePlaying}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold"
          >
            Continue Sandbox
          </button>
          <button
            type="button"
            onClick={onNewCareer}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold"
          >
            Start New Playthrough
          </button>
        </div>
      </div>
    </div>
  );
};
