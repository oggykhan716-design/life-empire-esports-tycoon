import React, { useMemo, useState } from 'react';
import {
  Building2,
  Clock,
  Coins,
  RotateCcw,
  Terminal,
  Trophy,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ESPORTS_TITLES, getGameById } from '../data/esportsTitles';
import { FACILITY_TIERS } from '../data/facilitiesAndStaff';
import {
  devAddRosterSlots,
  devAdjustMoney,
  devCompleteUpgrades,
  devCreatePaperTeam,
  devGenerateTestCompetition,
  devGenerateTestOrganisations,
  devGenerateTestPlayers,
  devInstantRecruitPlayer,
  devMaximizeOrgXp,
  devModifyRankings,
  devResetSystem,
  devSetBalance,
  devSetMonthlyCashflow,
  devSetOrgReputation,
  devSetOrgTypeAndStrategy,
  devSimulateTournament,
  devSkipDays,
  devSkipWeeks,
  devUnlockAllFacilities,
  devUnlockAllGameFeatures,
  devUnlockAllOrgUpgrades,
  devUnlockAllTournaments,
  devUnlockInternationalExpansion,
  devUnlockPaperTeam,
  devUpdatePlayerAttributes,
  devUpdatePlayerContract,
  MoneyTargetAccount,
  ORG_STRATEGIES,
  ORG_TYPES,
  ResettableSystem,
} from '../engine/devAndSandbox';
import { formatCurrency } from '../engine/economy';
import { DevSnapshot } from '../engine/storage';
import {
  GameState,
  OrgStrategy,
  OrgType,
  PlayerTier,
  TournamentTier,
} from '../types/game';

interface DeveloperDashboardModalProps {
  state: GameState;
  snapshots: DevSnapshot[];
  onApplyDevChange: (nextState: GameState, label: string) => void;
  onSaveSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onClose: () => void;
}

type DevTab = 'financial' | 'org' | 'team' | 'tournaments' | 'time' | 'general';

const PLAYER_TIERS: PlayerTier[] = [
  'Amateur',
  'Semi-professional',
  'Professional',
  'Established professional',
  'Superstar',
  'International legend',
];

const TOURNAMENT_TIERS: TournamentTier[] = [
  'Local',
  'Amateur League',
  'Regional Championship',
  'National Championship',
  'International Qualifier',
  'Major International',
  'World Championship',
];

export const DeveloperDashboardModal: React.FC<DeveloperDashboardModalProps> = ({
  state,
  snapshots,
  onApplyDevChange,
  onSaveSnapshot,
  onRestoreSnapshot,
  onClose,
}) => {
  const [tab, setTab] = useState<DevTab>('financial');

  // Financial form state
  const [moneyTarget, setMoneyTarget] = useState<MoneyTargetAccount>(
    state.org.founded ? 'org_bank' : 'personal_bank'
  );
  const [customBalanceInput, setCustomBalanceInput] = useState('1000000');
  const [removeAmountInput, setRemoveAmountInput] = useState('10000');
  const [monthlyRevInput, setMonthlyRevInput] = useState(
    String(state.devOverrides?.customMonthlyRevenueUSD ?? state.org.lastWeekRevenueUSD * 4)
  );
  const [monthlyExpInput, setMonthlyExpInput] = useState(
    String(state.devOverrides?.customMonthlyExpensesUSD ?? state.org.lastWeekExpensesUSD * 4)
  );

  // Org form state
  const [repInput, setRepInput] = useState(state.org.reputation);

  // Team & Player editor state
  const [selectedGameId, setSelectedGameId] = useState(
    state.org.divisions[0]?.gameId ?? 'vanguard_protocol'
  );
  const [selectedTier, setSelectedTier] = useState<PlayerTier>('Superstar');
  const allPlayers = useMemo(
    () => [...state.roster, ...state.marketPlayers],
    [state.roster, state.marketPlayers]
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    state.roster[0]?.id ?? state.marketPlayers[0]?.id ?? ''
  );
  const activePlayer =
    allPlayers.find((p) => p.id === selectedPlayerId) ?? allPlayers[0] ?? null;

  // Tournament & Rankings state
  const [rankPointsInput, setRankPointsInput] = useState('500');
  const [worldRankInput, setWorldRankInput] = useState('1');
  const [compTier, setCompTier] = useState<TournamentTier>('Major International');
  const [compPrizeInput, setCompPrizeInput] = useState('500000');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    state.tournaments.find((t) => t.status !== 'Completed')?.id ?? state.tournaments[0]?.id ?? ''
  );
  const [lastSimSummary, setLastSimSummary] = useState<string | null>(null);

  const countryId = state.character.countryId;
  const openTournaments = state.tournaments.filter((t) => t.status !== 'Completed');

  const tabs: { id: DevTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'financial', label: 'Financial', icon: Coins },
    { id: 'org', label: 'Organisation', icon: Building2 },
    { id: 'team', label: 'Team & Players', icon: Users },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'general', label: 'General', icon: Wrench },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-4xl bg-white dark:bg-[#0F141F] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B0E14] via-[#131B2E] to-[#1A1633] text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Terminal size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono text-amber-400">
                Developer Mode · {state.isSandbox ? 'Isolated Sandbox' : 'Career State'}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold truncate">
                Developer Testing Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSaveSnapshot(`Manual Checkpoint (Wk ${state.week})`)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold whitespace-nowrap"
            >
              Save Snapshot
            </button>
            {snapshots.length > 0 && (
              <button
                type="button"
                onClick={() => onRestoreSnapshot(snapshots[0].id)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw size={13} />
                Restore Previous
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Developer Dashboard"
              className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Telemetry Strip */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#0B0E14] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono tabular-nums shrink-0">
          <span>
            Date:{' '}
            <strong className="text-blue-500">
              Yr {state.year} · Wk {state.week} · Day {state.day ?? 1}/7
            </strong>
          </span>
          <span>
            Personal:{' '}
            <strong className="text-emerald-500">
              {formatCurrency(state.finances.cashUSD + state.finances.bankBalanceUSD, countryId, true)}
            </strong>
          </span>
          <span>
            Org Bank:{' '}
            <strong className="text-blue-400">
              {state.org.founded ? formatCurrency(state.org.bankBalanceUSD, countryId, true) : 'Unfounded'}
            </strong>
          </span>
          <span>
            Rep: <strong>{state.org.reputation}/100</strong>
          </span>
          <span>
            XP: <strong className="text-purple-400">{state.org.orgXp ?? 0}</strong>
          </span>
          <span>
            Fac: <strong>Tier {state.org.facilityLevel}/9</strong>
          </span>
        </div>

        {/* Section Tabs */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. FINANCIAL CONTROLS */}
          {tab === 'financial' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">Target Account</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'org_bank',
                        label: 'Org Bank',
                        val: state.org.founded ? formatCurrency(state.org.bankBalanceUSD, countryId, true) : 'Will Found Org',
                      },
                      {
                        id: 'personal_bank',
                        label: 'Personal Bank',
                        val: formatCurrency(state.finances.bankBalanceUSD, countryId, true),
                      },
                      {
                        id: 'personal_cash',
                        label: 'Personal Cash',
                        val: formatCurrency(state.finances.cashUSD, countryId, true),
                      },
                    ] as const
                  ).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setMoneyTarget(acc.id)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        moneyTarget === acc.id
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C]'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {acc.label}
                      </div>
                      <div className="font-mono text-xs text-emerald-500 tabular-nums mt-0.5">
                        {acc.val}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Injections */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">Quick Capital Injection (USD Base)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Add $10,000', amount: 10_000 },
                    { label: 'Add $100,000', amount: 100_000 },
                    { label: 'Add $1,000,000', amount: 1_000_000 },
                  ].map((btn) => (
                    <button
                      key={btn.amount}
                      type="button"
                      onClick={() =>
                        onApplyDevChange(devAdjustMoney(state, moneyTarget, btn.amount), btn.label)
                      }
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      + {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Custom Balance & Remove Money */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                  <div className="font-display font-semibold text-sm">Set Custom Balance (USD)</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={customBalanceInput}
                      onChange={(e) => setCustomBalanceInput(e.target.value)}
                      className="flex-1 min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onApplyDevChange(
                          devSetBalance(state, moneyTarget, Number(customBalanceInput) || 0),
                          `Set balance to $${Number(customBalanceInput) || 0}`
                        )
                      }
                      className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                  <div className="font-display font-semibold text-sm">Remove Money (USD)</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={removeAmountInput}
                      onChange={(e) => setRemoveAmountInput(e.target.value)}
                      className="flex-1 min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onApplyDevChange(
                          devAdjustMoney(state, moneyTarget, -(Number(removeAmountInput) || 0)),
                          `Removed $${Number(removeAmountInput) || 0}`
                        )
                      }
                      className="min-h-[42px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyDevChange(devSetBalance(state, moneyTarget, 0), 'Zeroed balance')
                      }
                      className="min-h-[42px] px-3 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold whitespace-nowrap"
                    >
                      Zero
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue & Expenses Override */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-display font-semibold text-sm">
                      Monthly Revenue &amp; Expenses Override (USD / 4 wks)
                    </div>
                    <div className="text-xs text-slate-500">
                      Overrides weekly org cashflow ticks (monthly figure divided by 4 weeks).
                    </div>
                  </div>
                  {(state.devOverrides?.customMonthlyRevenueUSD !== undefined ||
                    state.devOverrides?.customMonthlyExpensesUSD !== undefined) && (
                    <button
                      type="button"
                      onClick={() =>
                        onApplyDevChange(
                          devSetMonthlyCashflow(state, null, null),
                          'Cleared monthly revenue/expense overrides'
                        )
                      }
                      className="text-xs text-amber-500 font-semibold hover:underline"
                    >
                      Clear Override
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label className="space-y-1">
                    <span className="text-xs text-slate-500">Monthly Revenue (USD)</span>
                    <input
                      type="number"
                      min={0}
                      value={monthlyRevInput}
                      onChange={(e) => setMonthlyRevInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-500">Monthly Expenses (USD)</span>
                    <input
                      type="number"
                      min={0}
                      value={monthlyExpInput}
                      onChange={(e) => setMonthlyExpInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devSetMonthlyCashflow(
                          state,
                          Number(monthlyRevInput) || 0,
                          Number(monthlyExpInput) || 0
                        ),
                        'Applied monthly revenue & expenses override'
                      )
                    }
                    className="min-h-[42px] px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold"
                  >
                    Set Monthly Cashflow
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORGANISATION CONTROLS */}
          {tab === 'org' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-sm">
                      Organisation Reputation
                    </span>
                    <span className="font-mono text-sm font-bold text-blue-500">{repInput}/100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={repInput}
                    onChange={(e) => setRepInput(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devSetOrgReputation(state, repInput),
                        `Set org reputation to ${repInput}`
                      )
                    }
                    className="w-full min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Apply Reputation
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-display font-semibold text-sm">
                      Organisation XP &amp; Progression
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Current XP: <strong className="font-mono text-purple-400">{state.org.orgXp ?? 0}</strong> / 10,000
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(devMaximizeOrgXp(state), 'Maximised organisation XP')
                    }
                    className="w-full min-h-[42px] rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold"
                  >
                    Maximise Organisation XP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devUnlockAllOrgUpgrades(state),
                      'Unlocked every organisation upgrade'
                    )
                  }
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Unlock Every Org Upgrade
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devUnlockAllFacilities(state, true),
                      'Unlocked all facilities & upgraded to Tier 9'
                    )
                  }
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Unlock All Facilities (Tier 9)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devCompleteUpgrades(state),
                      'Instantly completed active upgrades'
                    )
                  }
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                >
                  Instantly Complete Upgrades
                </button>
              </div>

              {/* Org Type & Strategy Experimentation */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">
                  Organisation Type &amp; Strategy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={state.org.orgType ?? 'Standard'}
                    onChange={(e) =>
                      onApplyDevChange(
                        devSetOrgTypeAndStrategy(
                          state,
                          e.target.value as OrgType,
                          state.org.orgStrategy ?? 'Balanced'
                        ),
                        `Set Org Type: ${e.target.value}`
                      )
                    }
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} — {t.summary}
                      </option>
                    ))}
                  </select>
                  <select
                    value={state.org.orgStrategy ?? 'Balanced'}
                    onChange={(e) =>
                      onApplyDevChange(
                        devSetOrgTypeAndStrategy(
                          state,
                          state.org.orgType ?? 'Standard',
                          e.target.value as OrgStrategy
                        ),
                        `Set Org Strategy: ${e.target.value}`
                      )
                    }
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {ORG_STRATEGIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.summary}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {FACILITY_TIERS.map((f) => (
                    <button
                      key={f.level}
                      type="button"
                      onClick={() =>
                        onApplyDevChange(
                          {
                            ...devUnlockAllFacilities(state, false),
                            org: { ...devUnlockAllFacilities(state, false).org, facilityLevel: f.level },
                          },
                          `Set Facility to Tier ${f.level} (${f.name})`
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                        state.org.facilityLevel === f.level
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      T{f.level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. TEAM & PLAYER CONTROLS */}
          {tab === 'team' && (
            <div className="space-y-6">
              {/* Paper Team & Expansion */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">
                  Paper Teams, Expansion &amp; Roster Slots
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {ESPORTS_TITLES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.rosterSize}v{g.rosterSize})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as PlayerTier)}
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {PLAYER_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(devUnlockPaperTeam(state), 'Unlocked Paper Team')
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-purple-500/40 text-purple-400 text-xs font-semibold"
                  >
                    Unlock Paper Team
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devCreatePaperTeam(state, selectedGameId, selectedTier),
                        `Created Paper Team for ${getGameById(selectedGameId).name}`
                      )
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Instantly Create Paper Team
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devUnlockInternationalExpansion(state),
                        'Unlocked International Expansion'
                      )
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Unlock Intl. Expansion
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devAddRosterSlots(state, 5),
                        'Unlocked +5 additional roster/division slots'
                      )
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    +5 Roster Slots ({state.org.bonusRosterSlots ?? 0})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devInstantRecruitPlayer(state, { gameId: selectedGameId, tier: selectedTier }),
                      `Instantly recruited ${selectedTier} player for ${getGameById(selectedGameId).name}`
                    )
                  }
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold"
                >
                  Instantly Recruit {selectedTier} Player ({getGameById(selectedGameId).name})
                </button>
              </div>

              {/* Player Attribute & Contract Editor */}
              {activePlayer && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-display font-semibold text-sm">
                      Player Ratings, Attributes &amp; Contract Tester
                    </div>
                    <select
                      value={activePlayer.id}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="min-h-[40px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono"
                    >
                      {state.roster.length > 0 && (
                        <optgroup label="Your Roster">
                          {state.roster.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.ign} · {getGameById(p.gameId).name} ({p.overall} OVR)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Free Agents / Market">
                        {state.marketPlayers.slice(0, 30).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.ign} · {getGameById(p.gameId).name} ({p.overall} OVR)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Attribute Sliders */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {(
                      [
                        { key: 'mechanicalSkill', label: 'Mechanical' },
                        { key: 'gameSense', label: 'Game Sense' },
                        { key: 'communication', label: 'Comms' },
                        { key: 'consistency', label: 'Consistency' },
                        { key: 'mentalStrength', label: 'Mental' },
                        { key: 'adaptability', label: 'Adaptability' },
                        { key: 'experience', label: 'Experience' },
                        { key: 'potential', label: 'Potential' },
                      ] as const
                    ).map((attr) => (
                      <div key={attr.key} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{attr.label}</span>
                          <span className="font-mono font-bold">
                            {activePlayer.attributes[attr.key]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={99}
                          value={activePlayer.attributes[attr.key]}
                          onChange={(e) =>
                            onApplyDevChange(
                              devUpdatePlayerAttributes(state, activePlayer.id, {
                                [attr.key]: Number(e.target.value),
                              }),
                              `Updated ${activePlayer.ign} ${attr.label}`
                            )
                          }
                          className="w-full accent-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Contract & Transfer Actions */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">OVR / POT</span>
                        <strong className="text-blue-500">{activePlayer.overall} / {activePlayer.attributes.potential}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Salary (USD/mo)</span>
                        <strong className="text-emerald-500">${activePlayer.monthlySalaryUSD.toLocaleString()}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Contract</span>
                        <strong>{activePlayer.contractWeeksLeft} wks</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Status</span>
                        <strong>{activePlayer.orgId === 'player_org' ? (activePlayer.isStarter ? 'Starter' : 'Bench') : 'Free Agent'}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onApplyDevChange(
                            devUpdatePlayerAttributes(state, activePlayer.id, {
                              mechanicalSkill: 99,
                              gameSense: 99,
                              communication: 99,
                              consistency: 99,
                              experience: 99,
                              potential: 99,
                              discipline: 99,
                              adaptability: 99,
                              mentalStrength: 99,
                              reputation: 99,
                              morale: 100,
                              form: 100,
                              overall: 99,
                            }),
                            `Maxed all attributes to 99 for ${activePlayer.ign}`
                          )
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold"
                      >
                        Max All 99
                      </button>

                      {activePlayer.orgId !== 'player_org' ? (
                        <button
                          type="button"
                          onClick={() =>
                            onApplyDevChange(
                              devInstantRecruitPlayer(state, { marketPlayerId: activePlayer.id }),
                              `Instant transfer signed ${activePlayer.ign}`
                            )
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Instant Transfer to Club
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onApplyDevChange(
                                devUpdatePlayerContract(state, activePlayer.id, {
                                  isStarter: !activePlayer.isStarter,
                                }),
                                `${activePlayer.ign} moved to ${!activePlayer.isStarter ? 'Starters' : 'Bench'}`
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                          >
                            {activePlayer.isStarter ? 'Move to Bench' : 'Promote Starter'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onApplyDevChange(
                                devUpdatePlayerContract(state, activePlayer.id, {
                                  contractWeeksLeft: 1,
                                }),
                                `Set ${activePlayer.ign} contract to 1 week left`
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                          >
                            Test Expiring (1 wk)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onApplyDevChange(
                                devUpdatePlayerContract(state, activePlayer.id, {
                                  contractWeeksLeft: 52,
                                  monthlySalaryUSD: Math.max(500, Math.round(activePlayer.monthlySalaryUSD * 0.5)),
                                }),
                                `Renewed ${activePlayer.ign} for 52 wks at 50% salary`
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                          >
                            52-Wk Renewal (50% Pay)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onApplyDevChange(
                                {
                                  ...state,
                                  roster: state.roster.filter((p) => p.id !== activePlayer.id),
                                  marketPlayers: [
                                    { ...activePlayer, orgId: null, isStarter: false, isCaptain: false },
                                    ...state.marketPlayers,
                                  ],
                                },
                                `Released ${activePlayer.ign} to Free Agency`
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 text-xs font-semibold"
                          >
                            Release Transfer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. TOURNAMENT CONTROLS */}
          {tab === 'tournaments' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devUnlockAllTournaments(state),
                      'Unlocked every tournament tier'
                    )
                  }
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold"
                >
                  Unlock Every Tournament
                </button>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tournament Gate Bypass</span>
                  <strong className={state.devOverrides?.unlockAllTournaments || state.isSandbox ? 'text-emerald-500' : 'text-slate-400'}>
                    {state.devOverrides?.unlockAllTournaments || state.isSandbox ? 'Unlocked' : 'Standard'}
                  </strong>
                </div>
              </div>

              {/* Simulate Tournament Results */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">
                  Simulate Tournament Results
                </div>
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                >
                  {openTournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.tier} · Rd {t.round}/{t.maxRounds})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!selectedTournamentId}
                    onClick={() => {
                      const { nextState, lastReport } = devSimulateTournament(
                        state,
                        selectedTournamentId,
                        'next_round'
                      );
                      setLastSimSummary(
                        lastReport
                          ? `${lastReport.won ? 'WON' : 'LOST'} ${lastReport.scoreLine} vs ${lastReport.opponentName} (+${formatCurrency(lastReport.prizeWonUSD, countryId)})`
                          : null
                      );
                      onApplyDevChange(nextState, 'Simulated tournament round');
                    }}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Simulate Next Round
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTournamentId}
                    onClick={() => {
                      const { nextState, lastReport } = devSimulateTournament(
                        state,
                        selectedTournamentId,
                        'win_all'
                      );
                      setLastSimSummary(
                        lastReport
                          ? `CHAMPION: ${lastReport.tournamentName} (${lastReport.scoreLine} vs ${lastReport.opponentName})`
                          : null
                      );
                      onApplyDevChange(nextState, 'Simulated full championship win');
                    }}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Simulate Championship Win
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTournamentId}
                    onClick={() => {
                      const { nextState, lastReport } = devSimulateTournament(
                        state,
                        selectedTournamentId,
                        'lose_match'
                      );
                      setLastSimSummary(
                        lastReport
                          ? `ELIMINATED: ${lastReport.scoreLine} vs ${lastReport.opponentName}`
                          : null
                      );
                      onApplyDevChange(nextState, 'Simulated tournament elimination');
                    }}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold"
                  >
                    Simulate Loss
                  </button>
                </div>
                {lastSimSummary && (
                  <div className="text-xs font-mono text-emerald-400 pt-1">{lastSimSummary}</div>
                )}
              </div>

              {/* Modify Division Rankings */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">Modify Division Rankings</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {ESPORTS_TITLES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <label className="space-y-1">
                    <span className="text-[11px] text-slate-500">Rank Points</span>
                    <input
                      type="number"
                      min={0}
                      value={rankPointsInput}
                      onChange={(e) => setRankPointsInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-slate-500">World Rank (#)</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={worldRankInput}
                      onChange={(e) => setWorldRankInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyDevChange(
                        devModifyRankings(
                          state,
                          selectedGameId,
                          Number(rankPointsInput) || 0,
                          Number(worldRankInput) || 1
                        ),
                        `Updated ${getGameById(selectedGameId).name} ranking to #${worldRankInput}`
                      )
                    }
                    className="min-h-[42px] px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  >
                    Apply Ranking
                  </button>
                </div>
              </div>

              {/* Generate Test Competition */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">Generate Test Competition</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <select
                    value={compTier}
                    onChange={(e) => setCompTier(e.target.value as TournamentTier)}
                    className="min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs"
                  >
                    {TOURNAMENT_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="space-y-1">
                    <span className="text-[11px] text-slate-500">Prize Pool (USD)</span>
                    <input
                      type="number"
                      min={0}
                      value={compPrizeInput}
                      onChange={(e) => setCompPrizeInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = devGenerateTestCompetition(
                        state,
                        selectedGameId,
                        compTier,
                        Number(compPrizeInput) || 100000
                      );
                      setSelectedTournamentId(next.tournaments[0]?.id ?? '');
                      onApplyDevChange(
                        next,
                        `Generated ${compTier} test competition for ${getGameById(selectedGameId).name}`
                      );
                    }}
                    className="min-h-[42px] px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Generate Competition
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. TIME CONTROLS */}
          {tab === 'time' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Current Simulation Clock</div>
                  <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    Year {state.year} · Week {state.week} · Day {state.day ?? 1} of 7
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-slate-500">
                  Age {state.character.age}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => onApplyDevChange(devSkipDays(state, 1), 'Skipped 1 day')}
                  className="min-h-[54px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] hover:border-blue-500 text-left"
                >
                  <div className="font-display font-bold text-sm">Skip One Day</div>
                  <div className="text-xs text-slate-500">+1 day (+15 energy)</div>
                </button>
                <button
                  type="button"
                  onClick={() => onApplyDevChange(devSkipWeeks(state, 1), 'Skipped 1 week')}
                  className="min-h-[54px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] hover:border-blue-500 text-left"
                >
                  <div className="font-display font-bold text-sm">Skip One Week</div>
                  <div className="text-xs text-slate-500">Runs full weekly tick</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(devSkipWeeks(state, 4), 'Skipped 1 month (4 weeks)')
                  }
                  className="min-h-[54px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] hover:border-purple-500 text-left"
                >
                  <div className="font-display font-bold text-sm">Skip One Month</div>
                  <div className="text-xs text-slate-500">Simulates 4 weeks</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(devSkipWeeks(state, 52), 'Skipped 1 year (52 weeks)')
                  }
                  className="min-h-[54px] p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-left"
                >
                  <div className="font-display font-bold text-sm">Skip One Year</div>
                  <div className="text-xs text-blue-100">Simulates 52 weeks (+1 age)</div>
                </button>
              </div>
            </div>
          )}

          {/* 6. GENERAL CONTROLS */}
          {tab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devUnlockAllGameFeatures(state),
                      'Unlocked all game features'
                    )
                  }
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold"
                >
                  Unlock All Game Features
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devGenerateTestOrganisations(state, 3),
                      'Generated 3 test rival organisations'
                    )
                  }
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Generate Test Organisations (+3)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyDevChange(
                      devGenerateTestPlayers(state, selectedGameId, selectedTier, 5),
                      `Generated 5 ${selectedTier} players for ${getGameById(selectedGameId).name}`
                    )
                  }
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Generate Test Players (+5)
                </button>
              </div>

              {/* Reset Individual Systems */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="font-display font-semibold text-sm">
                  Reset Individual Game Systems
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'finances', label: 'Finances' },
                      { id: 'org', label: 'Organisation' },
                      { id: 'roster', label: 'Roster' },
                      { id: 'tournaments', label: 'Tournaments' },
                      { id: 'rivals', label: 'Rivals' },
                    ] as { id: ResettableSystem; label: string }[]
                  ).map((sys) => (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() =>
                        onApplyDevChange(
                          devResetSystem(state, sys.id),
                          `Reset ${sys.label} system`
                        )
                      }
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-semibold"
                    >
                      Reset {sys.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snapshots & Restore */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold text-sm">
                      Testing State Snapshots ({snapshots.length})
                    </div>
                    <div className="text-xs text-slate-500">
                      Captured automatically before developer mutations so you can restore anytime.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveSnapshot(`Manual Checkpoint (Wk ${state.week})`)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                  >
                    Capture Now
                  </button>
                </div>

                {snapshots.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    No snapshots yet. Run any developer control or capture a checkpoint to save one.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {snapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {snap.label}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            Yr {snap.year} · Wk {snap.week}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRestoreSnapshot(snap.id)}
                          className="min-h-[34px] px-3 py-1 rounded-lg border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold shrink-0"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
