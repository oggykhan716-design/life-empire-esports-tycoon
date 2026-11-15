import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Moon,
  Save,
  Settings,
  ShieldAlert,
  Sun,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { SaveSlotSummary } from '../engine/storage';
import { GameState } from '../types/game';

interface SettingsModalProps {
  state: GameState | null;
  darkMode: boolean;
  developerModeEnabled: boolean;
  sandboxSummary: SaveSlotSummary | null;
  onToggleDarkMode: () => void;
  onToggleDeveloperMode: (enabled: boolean) => void;
  onOpenDeveloperDashboard: () => void;
  onOpenSaveModal?: () => void;
  onStartSandbox: () => void;
  onResumeSandbox: () => void;
  onDeleteSandbox: () => void;
  onExitSandbox?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  state,
  darkMode,
  developerModeEnabled,
  sandboxSummary,
  onToggleDarkMode,
  onToggleDeveloperMode,
  onOpenDeveloperDashboard,
  onOpenSaveModal,
  onStartSandbox,
  onResumeSandbox,
  onDeleteSandbox,
  onExitSandbox,
  onClose,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(developerModeEnabled);
  const [buildTapCount, setBuildTapCount] = useState(0);

  const handleBuildTap = () => {
    const next = buildTapCount + 1;
    setBuildTapCount(next);
    if (next >= 3 && !showAdvanced) {
      setShowAdvanced(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#111723] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings size={20} className="text-blue-500" />
            Settings &amp; Modes
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Display & Save Controls */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Preferences
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between gap-3">
            <div>
              <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                Interface Theme
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Switch between dark charcoal and light workspace modes.
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {state && onOpenSaveModal && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between gap-3">
              <div>
                <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  Save &amp; Career Slots
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {state.isSandbox
                    ? 'Currently in isolated Sandbox Mode.'
                    : `Active Slot: ${state.saveSlotId.replace('_', ' ').toUpperCase()}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSaveModal();
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Save size={14} />
                Manage Saves
              </button>
            </div>
          )}
        </div>

        {/* Sandbox Mode Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-500 flex items-center gap-1.5">
              <FlaskConical size={14} />
              Sandbox Mode (Isolated)
            </span>
            {state?.isSandbox && (
              <span className="text-xs font-mono font-semibold text-purple-400">Active</span>
            )}
          </div>

          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-600/5 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Experiment with unlimited money, all 9 facilities, Paper Teams, international expansion, all org strategies, and every tournament tier. Saved separately so normal career slots remain untouched.
            </p>

            <div className="flex flex-wrap gap-2">
              {sandboxSummary && !state?.isSandbox && (
                <button
                  type="button"
                  onClick={() => {
                    onResumeSandbox();
                    onClose();
                  }}
                  className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Resume Sandbox (Yr {sandboxSummary.year} · Wk {sandboxSummary.week})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onStartSandbox();
                  onClose();
                }}
                className={`flex-1 min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
                  sandboxSummary && !state?.isSandbox
                    ? 'border border-purple-500/40 text-purple-400 hover:bg-purple-500/10'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                }`}
              >
                {state?.isSandbox ? 'Reset & New Sandbox' : 'Launch Fresh Sandbox'}
              </button>

              {state?.isSandbox && onExitSandbox && (
                <button
                  type="button"
                  onClick={() => {
                    onExitSandbox();
                    onClose();
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold whitespace-nowrap"
                >
                  Exit Sandbox
                </button>
              )}

              {sandboxSummary && !state?.isSandbox && (
                <button
                  type="button"
                  onClick={onDeleteSandbox}
                  aria-label="Delete Sandbox Save"
                  className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Developer Dashboard Access */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            type="button"
            onClick={() => {
              setShowAdvanced(!showAdvanced);
              handleBuildTap();
            }}
            className="w-full min-h-[40px] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <span className="font-mono">Advanced &amp; Developer Tools</span>
            {showAdvanced ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {showAdvanced && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert size={15} className="text-amber-500" />
                    Developer Mode
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unlocks real-time state controls for testing finances, orgs, teams, tournaments, and time.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={developerModeEnabled}
                  onClick={() => onToggleDeveloperMode(!developerModeEnabled)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    developerModeEnabled
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {developerModeEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {developerModeEnabled && (
                <button
                  type="button"
                  disabled={!state}
                  onClick={() => {
                    onClose();
                    onOpenDeveloperDashboard();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-display font-semibold text-xs inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Terminal size={15} />
                  {state ? 'Open Developer Dashboard' : 'Load or Start a Game to Use Dashboard'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
