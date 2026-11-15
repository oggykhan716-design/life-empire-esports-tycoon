import React from 'react';
import { Award, BookText, CheckCircle2, Save } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/eventsAndAchievements';
import { GameState } from '../types/game';

interface StoryViewProps {
  state: GameState;
  onOpenEventModal: () => void;
  onOpenSaveModal: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  state,
  onOpenEventModal,
  onOpenSaveModal,
}) => {
  const unlockedSet = new Set(state.unlockedAchievements);

  return (
    <div className="space-y-6">
      {state.pendingEvent && (
        <section className="fm-panel-elevated border-blue-500/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-blue-400">
              Pending Decision · {state.pendingEvent.category}
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {state.pendingEvent.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {state.pendingEvent.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenEventModal}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold whitespace-nowrap shrink-0"
          >
            Make Decision
          </button>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 fm-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookText size={18} className="text-blue-500" />
                Career Chronicle &amp; Decisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanent timeline of your decisions, signings, and titles.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSaveModal}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save size={14} />
              Save / Load
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto pr-1">
            {state.history.map((entry) => (
              <div key={entry.id} className="py-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono text-blue-500">Yr {entry.year} · Wk {entry.week}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.category}</span>
                </div>
                <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  {entry.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {entry.summary}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 fm-panel p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-purple-500" />
              Trophy &amp; Milestone Cabinet ({state.unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal wealth and global esports championship milestones.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedSet.has(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border ${
                    unlocked
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-blue-500 font-medium">{ach.category}</div>
                    {unlocked && <CheckCircle2 size={15} className="text-emerald-500" />}
                  </div>
                  <div className="font-display font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                    {ach.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{ach.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
