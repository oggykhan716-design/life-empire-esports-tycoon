import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Compass,
  Flag,
  Smartphone,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { getCountryById } from '../data/countries';
import { getGameById } from '../data/esportsTitles';
import { FACILITY_TIERS } from '../data/facilitiesAndStaff';
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
  onOpenPhone?: () => void;
  phoneUnreadCount?: number;
  onWorkShift: () => void;
  onBusinessResearch: () => void;
  onNetworking: () => void;
  onAdvanceWeek: () => void;
  onTriggerEnding: (endingId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onNavigate,
  onOpenPhone,
  phoneUnreadCount = 0,
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

  const activeFacility = FACILITY_TIERS.find((f) => f.level === state.org.facilityLevel);
  const activeTournament = state.tournaments.find((t) => t.status === 'In Progress');

  return (
    <div className="space-y-6">
      {/* Control Centre Top Command Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Executive Command Panel */}
        <section className="lg:col-span-8 fm-panel-elevated p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span>Manager Control Centre</span>
                <span aria-hidden="true">·</span>
                <span>{state.character.city}, {country.name}</span>
                <span aria-hidden="true">·</span>
                <span>{state.character.education}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {state.careerType === 'PLAYER' && state.playerCareer && !state.playerCareer.retired
                  ? `${state.playerCareer.ign} · ${state.character.firstName} ${state.character.lastName}`
                  : `${state.character.firstName} ${state.character.lastName}`}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {state.careerType === 'PLAYER' && state.playerCareer && !state.playerCareer.retired
                  ? `${state.playerCareer.rank} · ${getGameById(state.playerCareer.primaryGameId).name} · ${
                      state.playerCareer.currentOrgName
                        ? `Roster: ${state.playerCareer.currentOrgName}`
                        : 'Free Agent'
                    }`
                  : state.org.founded
                  ? `Founder & CEO · ${state.org.name} [${state.org.tag}] · ${activeFacility?.name ?? 'Small Office'}`
                  : state.registration.approvalWeeksRemaining > 0
                  ? `Organization application pending review (${state.registration.approvalWeeksRemaining} wk left)`
                  : currentJob
                  ? `${currentJob.title} (${JOB_LEVEL_LABELS[state.employment.level]})`
                  : 'Independent · Seeking initial employment'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {onOpenPhone && (
                <button
                  type="button"
                  onClick={onOpenPhone}
                  className="relative min-h-[44px] px-4 py-2 rounded-xl bg-[#0D1422] hover:bg-slate-800 border border-blue-500/40 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Smartphone size={16} className="text-blue-400" />
                  Open Phone
                  {phoneUnreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold inline-flex items-center justify-center">
                      {phoneUnreadCount > 99 ? '99+' : phoneUnreadCount}
                    </span>
                  )}
                </button>
              )}
              {state.org.founded && (
                <OrgCrest
                  name={state.org.name}
                  tag={state.org.tag}
                  color={state.org.color}
                  icon={state.org.icon}
                  size="xl"
                />
              )}
            </div>
          </div>

          {/* 4-Card KPI Telemetry Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Personal Cash</div>
              <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(state.finances.cashUSD, state.character.countryId)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Bank Savings</div>
              <div className="font-mono text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Personal Net Worth</div>
              <div className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(netWorthUSD, state.character.countryId, true)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Burn</div>
              <div className="font-mono text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(weeklyExpensesUSD, state.character.countryId)}
              </div>
            </div>
          </div>

          {/* Executive Attributes & Org Launch / Active Match Spotlight */}
          <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
              <span>
                Reputation <strong className="font-mono text-slate-900 dark:text-white">{state.character.reputation}</strong>
              </span>
              <span>
                Connections <strong className="font-mono text-slate-900 dark:text-white">{state.character.connections}</strong>
              </span>
              <span>
                Business Acumen <strong className="font-mono text-blue-500">{state.character.skills.businessAcumen}</strong>
              </span>
              <span>
                Esports IQ <strong className="font-mono text-purple-500">{state.character.skills.esportsKnowledge}</strong>
              </span>
              {state.finances.debtUSD > 0 && (
                <span className="text-red-500 font-semibold">
                  Debt <strong className="font-mono">{formatCurrency(state.finances.debtUSD, state.character.countryId)}</strong>
                </span>
              )}
            </div>

            {!state.org.founded ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Esports Organization Capital Target
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatCurrency(liquidSavingsUSD, state.character.countryId)} / {formatCurrency(startupTargetUSD, state.character.countryId)} ({startupPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-300"
                    style={{ width: `${startupPct}%` }}
                  />
                </div>
              </div>
            ) : activeTournament ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/30 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-blue-500">Active Tournament Bracket</div>
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    {activeTournament.name} · Round {activeTournament.round}/{activeTournament.maxRounds}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('esports')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Go to Matchday
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Right 4 Cols: Weekly Energy Tactical Dial & Dispatch */}
        <section className="lg:col-span-4 fm-panel p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap size={17} className="text-blue-500" />
                  Week {state.week} Energy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allocate weekly stamina across shifts and ops.
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {state.energy}<span className="text-xs font-normal text-slate-400">/100</span>
                </div>
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  state.energy >= 40
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500'
                    : state.energy > 0
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (state.energy / state.maxEnergy) * 100))}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {state.careerType === 'PLAYER' && state.playerCareer && !state.playerCareer.retired ? (
                <button
                  type="button"
                  onClick={() => onNavigate('career')}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-600/10 flex items-center justify-between text-left hover:bg-purple-600/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-purple-400" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pro Player Hub ({state.playerCareer.rank})
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Play matches, train attributes &amp; review tryouts
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-purple-400" />
                </button>
              ) : currentJob ? (
                <button
                  type="button"
                  onClick={onWorkShift}
                  disabled={
                    state.energy < currentJob.energyCost ||
                    state.employment.shiftsWorkedThisWeek >= currentJob.maxShiftsPerWeek
                  }
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] hover:border-blue-500 disabled:opacity-45 flex items-center justify-between text-left transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Work Shift: {currentJob.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{formatCurrency(shiftIncomeUSD, state.character.countryId)} · {state.employment.shiftsWorkedThisWeek}/{currentJob.maxShiftsPerWeek} shifts
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-blue-500 shrink-0 ml-2">
                    -{currentJob.energyCost} EN
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('career')}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-600/10 flex items-center justify-between text-left hover:bg-blue-600/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-blue-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Find Your First Job</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">10 local positions available</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-blue-500" />
                </button>
              )}

              <button
                type="button"
                onClick={onBusinessResearch}
                disabled={state.energy < energyCosts.research}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] hover:border-blue-500 disabled:opacity-45 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Market &amp; Esports Study</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">+2 Business · +2 Esports IQ</div>
                </div>
                <span className="font-mono text-xs font-semibold text-blue-500 shrink-0 ml-2">
                  -{energyCosts.research} EN
                </span>
              </button>

              <button
                type="button"
                onClick={onNetworking}
                disabled={state.energy < energyCosts.networking}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] hover:border-purple-500 disabled:opacity-45 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Industry Networking</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">+3 Connections · +1 Rep · +2 Neg</div>
                </div>
                <span className="font-mono text-xs font-semibold text-purple-500 shrink-0 ml-2">
                  -{energyCosts.networking} EN
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onAdvanceWeek}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-display font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg shadow-blue-600/20"
          >
            Advance to Week {state.week + 1}
            <ArrowRight size={17} />
          </button>
        </section>
      </div>

      {/* Club Overview & Sunday Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {state.org.founded ? 'Club Telemetry' : 'Organization Founding Blueprint'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('esports')}
              className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
            >
              {state.org.founded ? 'Squad & Arena' : 'Open Charter'}
              <ArrowRight size={13} />
            </button>
          </div>

          {state.org.founded ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Org Bank</div>
                  <div className="font-mono text-base font-bold tabular-nums mt-0.5">
                    {formatCurrency(state.org.bankBalanceUSD, state.character.countryId, true)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Valuation</div>
                  <div className="font-mono text-base font-bold tabular-nums text-emerald-500 mt-0.5">
                    {formatCurrency(state.org.valuationUSD, state.character.countryId, true)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Reputation</div>
                  <div className="font-mono text-base font-bold tabular-nums text-blue-500 mt-0.5">
                    {state.org.reputation}/100
                  </div>
                </div>
              </div>

              {state.org.divisions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {state.org.divisions.map((div) => (
                    <div key={div.gameId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                          {getGameById(div.gameId).name}
                        </span>
                        <span className="text-slate-500 ml-2">Rank #{div.worldRank}</span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {div.wins}W – {div.losses}L · Chem {div.chemistry}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No active competitive divisions yet. Open your first game circuit in the Esports tab.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Incorporating an official esports organization requires business registration, competitive licensing,
                legal compliance, brand identity, launch marketing, and an initial operational reserve.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Total Capital Needed</div>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(startupTargetUSD, state.character.countryId)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Filing Stamina</div>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    60 Energy
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sunday Weekly Dispatch */}
        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {state.lastWeeklyRecap
                ? `Week ${state.lastWeeklyRecap.week} Dispatch`
                : 'Weekly Operations Cycle'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('business')}
              className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
            >
              Treasury &amp; Charts
              <ArrowRight size={13} />
            </button>
          </div>

          {state.lastWeeklyRecap ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Personal Cashflow</div>
                  <div className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                    +{formatCurrency(state.lastWeeklyRecap.personalIncomeUSD, state.character.countryId)} / -
                    {formatCurrency(state.lastWeeklyRecap.personalExpensesUSD, state.character.countryId)}
                  </div>
                </div>
                {state.org.founded && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
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
                      <span className="text-blue-500 font-bold">·</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quiet operational week. Expenses settled cleanly and energy restored to 100.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every weekly turn flows from Monday planning through Saturday competition to Sunday accounting.
              Unused energy expires at week&apos;s end—deploy all 100 energy thoughtfully.
            </p>
          )}
        </section>
      </div>

      {/* Endgame Milestones */}
      <section className="fm-panel p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag size={18} className="text-purple-500" />
            Empire Legacy Milestones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multiple endgame paths. Claim an ending once qualified, or keep building indefinitely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500">
                <Building2 size={14} />
                Global #1 Valuation
              </div>
              <div className="font-display font-semibold text-sm">World&apos;s Biggest Org</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Surpass {formatCurrency(highestRivalVal, state.character.countryId, true)} valuation.
              </p>
            </div>
            <button
              type="button"
              disabled={!isBiggestOrg}
              onClick={() => onTriggerEnding('biggest_org')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-30 transition-opacity"
            >
              {isBiggestOrg ? 'Claim Legacy' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                <Trophy size={14} />
                World Titles: {worldTitles}/2
              </div>
              <div className="font-display font-semibold text-sm">World Championship Dynasty</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Win 2 Annual World Championship trophies.
              </p>
            </div>
            <button
              type="button"
              disabled={worldTitles < 2}
              onClick={() => onTriggerEnding('world_dynasty')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-30 transition-opacity"
            >
              {worldTitles >= 2 ? 'Claim Dynasty' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-500">
                <Compass size={14} />
                Divisions: {state.org.divisions.length}/4
              </div>
              <div className="font-display font-semibold text-sm">Multi-Game Empire</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operate 4+ divisions and capture 5+ trophies.
              </p>
            </div>
            <button
              type="button"
              disabled={!isMultiGameEmpire}
              onClick={() => onTriggerEnding('multi_game_empire')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-30 transition-opacity"
            >
              {isMultiGameEmpire ? 'Claim Empire' : 'In Progress'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                <TrendingUp size={14} />
                Strategic Exit
              </div>
              <div className="font-display font-semibold text-sm">
                {canRetireBillionaire ? 'Retire as Billionaire' : 'Sell Organization'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {canRetireBillionaire
                  ? 'Retire with $1B+ personal net worth.'
                  : 'Exit org at $250K+ valuation & become an investor.'}
              </p>
            </div>
            <button
              type="button"
              disabled={!canSellOrg && !canRetireBillionaire}
              onClick={() => onTriggerEnding(canRetireBillionaire ? 'billionaire_retirement' : 'sell_org')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-30 transition-opacity"
            >
              {canRetireBillionaire ? 'Retire Now' : canSellOrg ? 'Sell & Pivot' : 'Need $250K Val.'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
