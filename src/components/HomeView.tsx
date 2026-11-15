import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Compass,
  Flag,
  Landmark,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { getCountryById } from '../data/countries';
import { JOBS, JOB_LEVEL_LABELS } from '../data/jobs';
import {
  calculatePersonalNetWorthUSD,
  calculateWeeklyPersonalExpensesUSD,
  formatCurrency,
} from '../engine/economy';
import { calculateShiftIncomeUSD, getEnergyCosts } from '../engine/weeklyEngine';
import { GameState, NavTab } from '../types/game';
import { OrgCrest } from './OrgCrest';

interface HomeViewProps {
  state: GameState;
  onNavigate: (tab: NavTab) => void;
  onWorkShift: () => void;
  onBusinessResearch: () => void;
  onNetworking: () => void;
  onAdvanceWeek: () => void;
  onTriggerEnding: (endingId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onNavigate,
  onWorkShift,
  onBusinessResearch,
  onNetworking,
  onAdvanceWeek,
  onTriggerEnding,
}) => {
  const country = getCountryById(state.character.countryId);
  const netWorthUSD = calculatePersonalNetWorthUSD(state);
  const { total: weeklyExpensesUSD } = calculateWeeklyPersonalExpensesUSD(state);
  const currentJob = JOBS.find((j) => j.id === state.employment.currentJobId);
  const shiftIncomeUSD = calculateShiftIncomeUSD(state);
  const energyCosts = getEnergyCosts(state);

  const startupTargetUSD = Math.round(32500 * country.licenseCostMultiplier);
  const liquidSavingsUSD = state.finances.cashUSD + state.finances.bankBalanceUSD;
  const startupPct = Math.min(100, Math.round((liquidSavingsUSD / startupTargetUSD) * 100));

  const highestRivalVal = Math.max(
    ...state.rivals.filter((r) => r.status === 'Active').map((r) => r.valuationUSD),
    0
  );
  const worldTitles = state.org.trophies.filter((t) => t.tier === 'World Championship').length;
  const canSellOrg = state.org.founded && state.org.valuationUSD >= 250000;
  const canRetireBillionaire = netWorthUSD >= 1_000_000_000;
  const isBiggestOrg = state.org.founded && state.org.valuationUSD > highestRivalVal;
  const isMultiGameEmpire =
    state.org.founded && state.org.divisions.length >= 4 && state.org.trophies.length >= 5;

  return (
    <div className="space-y-6">
      {/* Top Hero Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Character & Current Situation */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Age {state.character.age}</span>
                <span aria-hidden="true">·</span>
                <span>{state.character.city}, {country.name}</span>
                <span aria-hidden="true">·</span>
                <span>{state.character.education}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {state.character.firstName} {state.character.lastName}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {state.org.founded
                  ? `Founder & CEO of ${state.org.name} (${state.org.tag}) · ${state.org.divisions.length} active division(s)`
                  : state.registration.approvalWeeksRemaining > 0
                  ? `Organization application pending review (${state.registration.approvalWeeksRemaining} week left)`
                  : currentJob
                  ? `${currentJob.title} (${JOB_LEVEL_LABELS[state.employment.level]})`
                  : 'Unemployed · Looking for early-career work'}
              </p>
            </div>

            {state.org.founded && (
              <div className="flex items-center gap-3 shrink-0">
                <OrgCrest
                  name={state.org.name}
                  tag={state.org.tag}
                  color={state.org.color}
                  icon={state.org.icon}
                  size="lg"
                />
              </div>
            )}
          </div>

          {/* 4-metric strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Personal Cash</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(state.finances.cashUSD, state.character.countryId)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Bank Savings</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Net Worth</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(netWorthUSD, state.character.countryId, true)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Expenses</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {formatCurrency(weeklyExpensesUSD, state.character.countryId)}
              </div>
            </div>
          </div>

          {/* Profile Attributes & Milestone Progress */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
              <span>
                Reputation <strong className="font-mono text-slate-900 dark:text-white">{state.character.reputation}</strong>
              </span>
              <span>
                Connections <strong className="font-mono text-slate-900 dark:text-white">{state.character.connections}</strong>
              </span>
              <span>
                Business Acumen <strong className="font-mono text-slate-900 dark:text-white">{state.character.skills.businessAcumen}</strong>
              </span>
              <span>
                Esports Knowledge <strong className="font-mono text-slate-900 dark:text-white">{state.character.skills.esportsKnowledge}</strong>
              </span>
              {state.finances.debtUSD > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Debt <strong className="font-mono">{formatCurrency(state.finances.debtUSD, state.character.countryId)}</strong>
                </span>
              )}
            </div>

            {!state.org.founded && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Esports Organization Capital Goal
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatCurrency(liquidSavingsUSD, state.character.countryId)} / {formatCurrency(startupTargetUSD, state.character.countryId)} ({startupPct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${startupPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Weekly Energy & Quick Actions */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Week {state.week} Planner
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Combine work, research, and management before advancing to Sunday.
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {state.energy}<span className="text-xs font-normal text-slate-400">/{state.maxEnergy}</span>
                </div>
                <div className="text-[11px] text-slate-500">Energy Left</div>
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  state.energy >= 40 ? 'bg-blue-600' : state.energy > 0 ? 'bg-amber-500' : 'bg-slate-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (state.energy / state.maxEnergy) * 100))}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {currentJob ? (
                <button
                  type="button"
                  onClick={onWorkShift}
                  disabled={
                    state.energy < currentJob.energyCost ||
                    state.employment.shiftsWorkedThisWeek >= currentJob.maxShiftsPerWeek
                  }
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 disabled:opacity-45 disabled:hover:border-slate-200 flex items-center justify-between text-left transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Work Shift: {currentJob.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{formatCurrency(shiftIncomeUSD, state.character.countryId)} · {state.employment.shiftsWorkedThisWeek}/{currentJob.maxShiftsPerWeek} shifts used
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                    -{currentJob.energyCost} EN
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('career')}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between text-left hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-blue-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Find Your First Job</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Browse 10 local employment options</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-blue-600" />
                </button>
              )}

              <button
                type="button"
                onClick={onBusinessResearch}
                disabled={state.energy < energyCosts.research}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 disabled:opacity-45 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Business & Esports Research</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">+2 Business Acumen · +2 Esports Knowledge</div>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                  -{energyCosts.research} EN
                </span>
              </button>

              <button
                type="button"
                onClick={onNetworking}
                disabled={state.energy < energyCosts.networking}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 disabled:opacity-45 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Industry Networking</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">+3 Connections · +1 Reputation · +2 Negotiation</div>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                  -{energyCosts.networking} EN
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onAdvanceWeek}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
          >
            Advance to Week {state.week + 1}
            <ArrowRight size={17} />
          </button>
        </section>
      </div>

      {/* Organization Snapshot OR Launch Callout + Weekly Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {state.org.founded ? 'Organization Summary' : 'Path to Founding'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('esports')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              {state.org.founded ? 'Manage Esports' : 'Open Registration'}
              <ArrowRight size={13} />
            </button>
          </div>

          {state.org.founded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Org Bank</div>
                <div className="font-mono text-base font-semibold tabular-nums">
                  {formatCurrency(state.org.bankBalanceUSD, state.character.countryId, true)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Valuation</div>
                <div className="font-mono text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(state.org.valuationUSD, state.character.countryId, true)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Reputation</div>
                <div className="font-mono text-base font-semibold tabular-nums">{state.org.reputation}/100</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Followers</div>
                <div className="font-mono text-base font-semibold tabular-nums">
                  {state.org.followers.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Signed Players</div>
                <div className="font-mono text-base font-semibold tabular-nums">{state.roster.length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Trophies</div>
                <div className="font-mono text-base font-semibold tabular-nums">{state.org.trophies.length}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Establishing an esports organization requires business registration, an official esports license,
                legal paperwork, branding, marketing launch, and an operational reserve.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500 dark:text-slate-400">Required Reserve + Fees</div>
                  <div className="font-mono font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(startupTargetUSD, state.character.countryId)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500 dark:text-slate-400">Filing Energy Required</div>
                  <div className="font-mono font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                    60 Energy
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sunday Weekly Recap */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {state.lastWeeklyRecap
                ? `Week ${state.lastWeeklyRecap.week} Summary`
                : 'Weekly Financial Rhythm'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('business')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Finances
              <ArrowRight size={13} />
            </button>
          </div>

          {state.lastWeeklyRecap ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500 dark:text-slate-400">Personal Cashflow</div>
                  <div className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                    +{formatCurrency(state.lastWeeklyRecap.personalIncomeUSD, state.character.countryId)} / -
                    {formatCurrency(state.lastWeeklyRecap.personalExpensesUSD, state.character.countryId)}
                  </div>
                </div>
                {state.org.founded && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-500 dark:text-slate-400">Org Cashflow</div>
                    <div className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                      +{formatCurrency(state.lastWeeklyRecap.orgRevenueUSD, state.character.countryId)} / -
                      {formatCurrency(state.lastWeeklyRecap.orgExpensesUSD, state.character.countryId)}
                    </div>
                  </div>
                )}
              </div>
              {state.lastWeeklyRecap.highlights.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {state.lastWeeklyRecap.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">·</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quiet week. Expenses settled cleanly and energy refreshed to 100.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every turn moves from Monday planning through Saturday matches to Sunday settlement.
              Unused energy does not carry over—spend your 100 energy thoughtfully each week.
            </p>
          )}
        </section>
      </div>

      {/* Endgame Ambitions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag size={18} className="text-blue-600" />
              Empire Endgame Paths
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No single ending is mandatory. Claim a legacy milestone whenever you qualify, or keep expanding endlessly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Building2 size={14} />
                Global #1 Valuation
              </div>
              <div className="font-display font-semibold text-sm">World&apos;s Biggest Org</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Surpass {formatCurrency(highestRivalVal, state.character.countryId, true)} in org valuation.
              </p>
            </div>
            <button
              type="button"
              disabled={!isBiggestOrg}
              onClick={() => onTriggerEnding('biggest_org')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-35 transition-opacity"
            >
              {isBiggestOrg ? 'Claim Legacy' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Trophy size={14} />
                World Titles: {worldTitles}/2
              </div>
              <div className="font-display font-semibold text-sm">Multiple World Championships</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Win at least two Annual World Championship trophies.
              </p>
            </div>
            <button
              type="button"
              disabled={worldTitles < 2}
              onClick={() => onTriggerEnding('world_dynasty')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-35 transition-opacity"
            >
              {worldTitles >= 2 ? 'Claim Dynasty' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Compass size={14} />
                Divisions: {state.org.divisions.length}/4
              </div>
              <div className="font-display font-semibold text-sm">Multi-Game Empire</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operate 4+ active game divisions and lift 5+ championship trophies.
              </p>
            </div>
            <button
              type="button"
              disabled={!isMultiGameEmpire}
              onClick={() => onTriggerEnding('multi_game_empire')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-35 transition-opacity"
            >
              {isMultiGameEmpire ? 'Claim Empire' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <TrendingUp size={14} />
                Strategic Exit / Retirement
              </div>
              <div className="font-display font-semibold text-sm">
                {canRetireBillionaire ? 'Retire as Billionaire' : 'Sell Organization'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {canRetireBillionaire
                  ? 'Retire with $1B+ personal net worth.'
                  : 'Exit org at $250K+ valuation and pivot to private investing.'}
              </p>
            </div>
            <button
              type="button"
              disabled={!canSellOrg && !canRetireBillionaire}
              onClick={() => onTriggerEnding(canRetireBillionaire ? 'billionaire_retirement' : 'sell_org')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-35 transition-opacity"
            >
              {canRetireBillionaire ? 'Retire Now' : canSellOrg ? 'Sell & Pivot' : 'Need $250K Val.'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
