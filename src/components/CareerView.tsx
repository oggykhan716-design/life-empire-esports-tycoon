import React from 'react';
import { Briefcase, CheckCircle2, GraduationCap, LogOut, TrendingUp } from 'lucide-react';
import { getCountryById } from '../data/countries';
import {
  EDUCATION_ORDER,
  EDUCATION_PROGRAMS,
  JOB_LEVEL_LABELS,
  JOB_LEVEL_MULTIPLIER,
  JOBS,
} from '../data/jobs';
import { formatCurrency } from '../engine/economy';
import { calculateShiftIncomeUSD } from '../engine/weeklyEngine';
import { CharacterSkills, EducationLevel, GameState, JobDefinition } from '../types/game';

interface CareerViewProps {
  state: GameState;
  onApplyJob: (jobId: string) => void;
  onResignJob: () => void;
  onWorkShift: () => void;
  onStudyProgram: (level: EducationLevel) => void;
  onTrainSkill: (skillKey: keyof CharacterSkills) => void;
}

export const CareerView: React.FC<CareerViewProps> = ({
  state,
  onApplyJob,
  onResignJob,
  onWorkShift,
  onStudyProgram,
  onTrainSkill,
}) => {
  const country = getCountryById(state.character.countryId);
  const currentJob = JOBS.find((j) => j.id === state.employment.currentJobId);
  const shiftIncomeUSD = calculateShiftIncomeUSD(state);
  const currentEduIdx = EDUCATION_ORDER.indexOf(state.character.education);

  const canApply = (job: JobDefinition) => {
    const reqEduIdx = EDUCATION_ORDER.indexOf(job.requiredEducation);
    return currentEduIdx >= reqEduIdx && state.character.connections >= job.minConnections;
  };

  const getLocalizedJobPay = (job: JobDefinition) => {
    const levelMult =
      state.employment.currentJobId === job.id
        ? JOB_LEVEL_MULTIPLIER[state.employment.level]
        : 1.0;
    const gross = job.baseWeeklyIncomeUSD * country.wageMultiplier * levelMult;
    return Math.round(gross * (1 - country.taxRate * 0.6));
  };

  const skillCards: { key: keyof CharacterSkills; label: string; desc: string }[] = [
    { key: 'workEthic', label: 'Work Ethic', desc: 'Boosts job shift payouts & consistency' },
    { key: 'businessAcumen', label: 'Business Acumen', desc: 'Improves org efficiency & investments' },
    { key: 'esportsKnowledge', label: 'Esports IQ', desc: 'Sharper scouting & match reads' },
    { key: 'negotiation', label: 'Negotiation', desc: 'Better player contracts & sponsor terms' },
    { key: 'leadership', label: 'Leadership', desc: 'Improves team chemistry & staff cohesion' },
    { key: 'marketing', label: 'Marketing', desc: 'Accelerates fan growth & merch sales' },
  ];

  return (
    <div className="space-y-6">
      {/* Employment Command Header */}
      <section className="fm-panel-elevated p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
              <span>Career &amp; Employment</span>
              <span aria-hidden="true">·</span>
              <span>{country.name} Market ({Math.round(country.wageMultiplier * 100)}% Wage Index)</span>
            </div>
            {currentJob ? (
              <>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentJob.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {JOB_LEVEL_LABELS[state.employment.level]} · {state.employment.weeksInRole} weeks in role · Streak{' '}
                  <strong className="font-mono">{state.employment.consistencyStreak}</strong>
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                  Seeking Employment
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Accept an entry-level role below to start building capital for your esports organization.
                </p>
              </>
            )}
          </div>

          {currentJob && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onWorkShift}
                disabled={
                  state.energy < currentJob.energyCost ||
                  state.employment.shiftsWorkedThisWeek >= currentJob.maxShiftsPerWeek
                }
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 text-white text-sm font-semibold transition-all whitespace-nowrap shadow-md shadow-blue-600/20"
              >
                Work Shift (+{formatCurrency(shiftIncomeUSD, state.character.countryId)} · -{currentJob.energyCost} EN)
              </button>
              <button
                type="button"
                onClick={onResignJob}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-red-500/50 text-slate-700 dark:text-slate-300 hover:text-red-500 text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <LogOut size={15} />
                Resign
              </button>
            </div>
          )}
        </div>

        {/* 5-Stage Promotion Ladder */}
        {currentJob && (
          <div className="space-y-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((lvl) => {
                const reached = state.employment.level >= lvl;
                const current = state.employment.level === lvl;
                return (
                  <div
                    key={lvl}
                    className={`p-2.5 rounded-xl border text-center transition-colors ${
                      current
                        ? 'border-blue-500 bg-blue-600/15 text-slate-900 dark:text-white'
                        : reached
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-mono text-[11px] font-bold">LVL {lvl}</div>
                    <div className="text-[11px] truncate mt-0.5">{JOB_LEVEL_LABELS[lvl].split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Net Shift Pay: {formatCurrency(shiftIncomeUSD, state.character.countryId)}</span>
              <span>Shifts Used: {state.employment.shiftsWorkedThisWeek}/{currentJob.maxShiftsPerWeek}</span>
              <span>
                Next Promotion:{' '}
                {state.employment.level >= 5
                  ? 'Max Rank'
                  : `${state.employment.consistencyStreak}/${state.employment.level * 4 + 2} streak`}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Main Asymmetric Split: Job Market (7 cols) + Skills & Education (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Local Job Board */}
        <section className="lg:col-span-7 fm-panel p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase size={18} className="text-blue-500" />
              Local Job Market (10 Roles)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Wages and shift yields scale automatically with {country.name}&apos;s economy.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {JOBS.map((job) => {
              const isCurrent = state.employment.currentJobId === job.id;
              const eligible = canApply(job);
              const pay = getLocalizedJobPay(job);

              return (
                <div
                  key={job.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{job.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Req: {job.requiredEducation}</span>
                      {job.minConnections > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{job.minConnections}+ Conn</span>
                        </>
                      )}
                    </div>
                    <div className="font-display font-semibold text-base text-slate-900 dark:text-white">
                      {job.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{job.description}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(pay, state.character.countryId)} / shift
                      </div>
                      <div className="font-mono text-xs text-slate-500 tabular-nums">
                        {job.energyCost} EN · {job.maxShiftsPerWeek}/wk
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || !eligible}
                      onClick={() => onApplyJob(job.id)}
                      className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : eligible
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isCurrent ? 'Active' : eligible ? 'Accept' : 'Locked'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Skills Matrix + Academic Track */}
        <div className="lg:col-span-5 space-y-6">
          <section className="fm-panel p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-500" />
                Executive Attributes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Train any attribute for 20 energy (+3 rating).
              </p>
            </div>

            <div className="space-y-3">
              {skillCards.map((sk) => {
                const val = state.character.skills[sk.key];
                return (
                  <div
                    key={sk.key}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">{sk.label}</span>
                        <span className="font-mono font-bold text-blue-500 tabular-nums">{val}/100</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sk.desc}</div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={state.energy < 20 || val >= 100}
                      onClick={() => onTrainSkill(sk.key)}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-blue-500 disabled:opacity-40 text-xs font-semibold whitespace-nowrap transition-colors"
                    >
                      -20 EN
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="fm-panel p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-500" />
                Academic Credentials
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current: <strong className="text-slate-900 dark:text-white">{state.character.education}</strong>
              </p>
            </div>

            <div className="space-y-2.5">
              {EDUCATION_PROGRAMS.map((prog) => {
                const progIdx = EDUCATION_ORDER.indexOf(prog.level);
                const completed = currentEduIdx >= progIdx;
                const isNext = currentEduIdx + 1 === progIdx;
                const scaledTuition = Math.round(prog.tuitionUSD * country.livingCostMultiplier);
                const canAfford = state.finances.cashUSD + state.finances.bankBalanceUSD >= scaledTuition;

                return (
                  <div
                    key={prog.level}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                          {prog.level}
                        </span>
                        {completed && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{prog.skillBonusDesc}</p>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatCurrency(scaledTuition, state.character.countryId)} · {prog.energyCost} EN
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={completed || !isNext || !canAfford || state.energy < prog.energyCost}
                      onClick={() => onStudyProgram(prog.level)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        completed
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : isNext && canAfford && state.energy >= prog.energyCost
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {completed ? 'Earned' : isNext ? 'Enroll' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
