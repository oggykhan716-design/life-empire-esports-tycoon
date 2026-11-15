import React from 'react';
import { Award, BookOpen, Briefcase, CheckCircle2, GraduationCap, LogOut, TrendingUp } from 'lucide-react';
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
    { key: 'esportsKnowledge', label: 'Esports Knowledge', desc: 'Sharper scouting & match reads' },
    { key: 'negotiation', label: 'Negotiation', desc: 'Better player contracts & sponsor terms' },
    { key: 'leadership', label: 'Leadership', desc: 'Improves team chemistry & staff cohesion' },
    { key: 'marketing', label: 'Marketing', desc: 'Accelerates fan growth & merch sales' },
  ];

  return (
    <div className="space-y-6">
      {/* Current Employment Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Employment Status</span>
              <span aria-hidden="true">·</span>
              <span>{country.name} Market ({Math.round(country.wageMultiplier * 100)}% Wage Index)</span>
            </div>
            {currentJob ? (
              <>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {currentJob.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {JOB_LEVEL_LABELS[state.employment.level]} (Level {state.employment.level}/5) ·{' '}
                  {state.employment.weeksInRole} weeks in role · Consistency streak {state.employment.consistencyStreak}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Currently Unemployed
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pick an entry-level job below to earn weekly income and save toward your esports organization.
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
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Work Shift (+{formatCurrency(shiftIncomeUSD, state.character.countryId)} · -{currentJob.energyCost} EN)
              </button>
              <button
                type="button"
                onClick={onResignJob}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 text-slate-700 dark:text-slate-300 hover:text-red-600 text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <LogOut size={15} />
                Resign
              </button>
            </div>
          )}
        </div>

        {currentJob && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Net Pay / Shift</div>
              <div className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(shiftIncomeUSD, state.character.countryId)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Shifts This Week</div>
              <div className="font-mono font-semibold tabular-nums">
                {state.employment.shiftsWorkedThisWeek} / {currentJob.maxShiftsPerWeek}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Energy Cost</div>
              <div className="font-mono font-semibold tabular-nums">{currentJob.energyCost} EN</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Next Promotion Goal</div>
              <div className="font-mono font-semibold tabular-nums">
                {state.employment.level >= 5
                  ? 'Max Level'
                  : `${state.employment.consistencyStreak}/${state.employment.level * 4 + 2} streak`}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Job Market */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            Local Job Market
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Higher-tier positions require vocational or degree credentials and industry connections.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {JOBS.map((job) => {
            const isCurrent = state.employment.currentJobId === job.id;
            const eligible = canApply(job);
            const pay = getLocalizedJobPay(job);

            return (
              <div
                key={job.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{job.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Req: {job.requiredEducation}</span>
                    {job.minConnections > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{job.minConnections}+ Connections</span>
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
                    <div className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(pay, state.character.countryId)} / shift
                    </div>
                    <div className="font-mono text-xs text-slate-500 tabular-nums">
                      {job.energyCost} EN · max {job.maxShiftsPerWeek}/wk
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isCurrent || !eligible}
                    onClick={() => onApplyJob(job.id)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : eligible
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isCurrent ? 'Active Role' : eligible ? 'Accept Job' : 'Locked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills & Education Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Skills */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Personal Skills
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invest 20 energy to sharpen a core executive or competitive skill (+3 points).
            </p>
          </div>

          <div className="space-y-3">
            {skillCards.map((sk) => {
              const val = state.character.skills[sk.key];
              return (
                <div
                  key={sk.key}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white">{sk.label}</span>
                      <span className="font-mono font-semibold tabular-nums">{val}/100</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sk.desc}</div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={state.energy < 20 || val >= 100}
                    onClick={() => onTrainSkill(sk.key)}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-600 disabled:opacity-40 text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    Train (-20 EN)
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Education */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600" />
              Higher Education & Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current Credential: <strong className="text-slate-900 dark:text-white">{state.character.education}</strong>
            </p>
          </div>

          <div className="space-y-3">
            {EDUCATION_PROGRAMS.map((prog) => {
              const progIdx = EDUCATION_ORDER.indexOf(prog.level);
              const completed = currentEduIdx >= progIdx;
              const isNext = currentEduIdx + 1 === progIdx;
              const scaledTuition = Math.round(prog.tuitionUSD * country.livingCostMultiplier);
              const canAfford = state.finances.cashUSD + state.finances.bankBalanceUSD >= scaledTuition;

              return (
                <div
                  key={prog.level}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                        {prog.level}
                      </span>
                      {completed && <CheckCircle2 size={15} className="text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{prog.skillBonusDesc}</p>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      Tuition: {formatCurrency(scaledTuition, state.character.countryId)} · {prog.energyCost} EN
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={completed || !isNext || !canAfford || state.energy < prog.energyCost}
                    onClick={() => onStudyProgram(prog.level)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                        : isNext && canAfford && state.energy >= prog.energyCost
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {completed ? 'Completed' : isNext ? 'Enroll & Graduate' : 'Requires Prior Degree'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
