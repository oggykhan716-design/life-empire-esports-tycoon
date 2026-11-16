import React, { useState } from 'react';
import {
  Award,
  Building2,
  Check,
  Dumbbell,
  Handshake,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  UserCheck,
  X,
} from 'lucide-react';
import { getGameById } from '../data/esportsTitles';
import {
  negotiateSalaryIncrease,
  resolvePlayerContractOffer,
} from '../engine/career/contractEngine';
import {
  playPlayerCareerMatch,
  retirePlayerIntoOrgOwner,
  trainPlayerCareerAttribute,
} from '../engine/career/playerCareerEngine';
import { respondToTryoutInvite } from '../engine/career/tryoutEngine';
import { formatCurrency } from '../engine/economy';
import { GameState } from '../types/game';

interface PlayerCareerViewProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
  onOpenPhone: () => void;
}

export const PlayerCareerView: React.FC<PlayerCareerViewProps> = ({
  state,
  onUpdateState,
  onOpenPhone,
}) => {
  const pc = state.playerCareer;
  const [retireOrgName, setRetireOrgName] = useState(
    pc ? `${pc.ign} Esports` : 'Empire Esports'
  );
  const [retireOrgTag, setRetireOrgTag] = useState(
    pc ? pc.ign.slice(0, 3).toUpperCase() || 'PRO' : 'EMP'
  );
  const [showRetireBox, setShowRetireBox] = useState(false);

  if (!pc) return null;

  const game = getGameById(pc.primaryGameId);
  const pendingTryouts = pc.tryouts.filter((t) => t.status === 'pending' && t.expiresWeek >= state.week);
  const pendingOffers = pc.contractOffers.filter((o) => o.status === 'pending');

  const winRate =
    pc.matchesPlayed > 0 ? Math.round((pc.matchesWon / pc.matchesPlayed) * 100) : 0;

  const attributeList: { label: string; key: keyof typeof pc.attributes; color: string }[] = [
    { label: 'Skill', key: 'skill', color: 'from-blue-500 to-cyan-400' },
    { label: 'Consistency', key: 'consistency', color: 'from-indigo-500 to-blue-400' },
    { label: 'Experience', key: 'experience', color: 'from-violet-500 to-purple-400' },
    { label: 'Reputation', key: 'reputation', color: 'from-emerald-500 to-teal-400' },
    { label: 'Popularity', key: 'popularity', color: 'from-pink-500 to-rose-400' },
    { label: 'Potential', key: 'potential', color: 'from-amber-500 to-yellow-400' },
    { label: 'Teamwork', key: 'teamwork', color: 'from-sky-500 to-blue-400' },
    { label: 'Clutch / Pressure', key: 'pressure', color: 'from-rose-500 to-orange-400' },
  ];

  const handleTrain = (focus: 'skill' | 'consistency' | 'teamwork' | 'pressure') => {
    const res = trainPlayerCareerAttribute(state, focus);
    onUpdateState(res.nextState, res.message);
  };

  const handleMatch = (mode: 'ranked_open' | 'pro_match') => {
    const res = playPlayerCareerMatch(state, mode);
    onUpdateState(res.nextState, res.summary);
  };

  const handleTryout = (tryoutId: string, accept: boolean) => {
    const res = respondToTryoutInvite(state, tryoutId, accept);
    onUpdateState(res.nextState, res.outcome);
  };

  const handleContract = (
    offerId: string,
    decision: 'accept' | 'reject' | 'negotiate'
  ) => {
    const res = resolvePlayerContractOffer(state, offerId, decision);
    onUpdateState(res.nextState, res.outcome);
  };

  const handleNegotiateRaise = () => {
    const res = negotiateSalaryIncrease(state);
    onUpdateState(res.nextState, res.outcome);
  };

  const handleRequestTransfer = () => {
    if (!pc.currentOrgId) return;
    onUpdateState(
      {
        ...state,
        playerCareer: {
          ...pc,
          transferRequested: true,
        },
      },
      'Transfer request submitted. Rival scouts will target you next week.'
    );
  };

  const handleLeaveOrg = () => {
    if (!pc.currentOrgId) return;
    onUpdateState(
      {
        ...state,
        playerCareer: {
          ...pc,
          currentOrgId: null,
          currentOrgName: null,
          currentOrgTag: null,
          monthlySalaryUSD: 0,
          contractWeeksLeft: 0,
          isStarter: false,
          transferRequested: false,
        },
      },
      `Entered free agency after leaving ${pc.currentOrgName}.`
    );
  };

  const handleRetire = (e: React.FormEvent) => {
    e.preventDefault();
    const res = retirePlayerIntoOrgOwner(state, retireOrgName, retireOrgTag);
    onUpdateState(res.nextState, res.message);
    setShowRetireBox(false);
  };

  return (
    <div className="space-y-6">
      {/* Pro Athlete Hero Profile */}
      <section className="fm-panel-elevated p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center font-display text-xl font-extrabold text-white shadow-lg shadow-blue-600/25 shrink-0">
            {pc.ign.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-blue-500 font-semibold">
              <span>{pc.rank}</span>
              <span aria-hidden="true">·</span>
              <span>{game.name}</span>
              <span aria-hidden="true">·</span>
              <span>{pc.preferredRole}</span>
              <span aria-hidden="true">·</span>
              <span>{pc.startingBackground}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {pc.ign}{' '}
              <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                ({state.character.firstName} {state.character.lastName})
              </span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {pc.currentOrgId
                ? `Signed to ${pc.currentOrgName} [${pc.currentOrgTag}] · ${
                    pc.isStarter ? 'Starting Roster' : 'Substitute / Academy'
                  } · ${pc.contractWeeksLeft} wks left`
                : 'Free Agent · Competing in Open Qualifiers & Tryouts'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Monthly Salary</div>
            <div className="font-mono text-base font-bold text-emerald-500 tabular-nums">
              {formatCurrency(pc.monthlySalaryUSD, state.character.countryId)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Avg Rating</div>
            <div className="font-mono text-base font-bold text-blue-500 tabular-nums">
              {pc.avgRating.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Record / Win%</div>
            <div className="font-mono text-base font-bold tabular-nums">
              {pc.matchesWon}–{pc.matchesPlayed - pc.matchesWon} ({winRate}%)
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">MVPs / Trophies</div>
            <div className="font-mono text-base font-bold text-amber-500 tabular-nums">
              {pc.mvpCount} / {pc.trophiesWon}
            </div>
          </div>
        </div>
      </section>

      {/* Match Competition & Practice Drills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Swords size={18} className="text-blue-500" />
                Competitive Play &amp; Drills
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance drives ratings, World Events, scout tryouts, and sponsor value.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-500">
              {state.energy}/100 EN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={state.energy < 20}
              onClick={() => handleMatch('ranked_open')}
              className="min-h-[60px] p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-45 text-white text-left flex items-center justify-between transition-all"
            >
              <div>
                <div className="text-sm font-bold">Open Qualifier Match</div>
                <div className="text-[11px] text-blue-100">Ranked / Mix · +Prize &amp; Rep</div>
              </div>
              <span className="font-mono text-xs font-semibold shrink-0 ml-2">-20 EN</span>
            </button>

            <button
              type="button"
              disabled={!pc.currentOrgId || state.energy < 25}
              onClick={() => handleMatch('pro_match')}
              className="min-h-[60px] p-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white text-left flex items-center justify-between transition-all"
            >
              <div>
                <div className="text-sm font-bold">Pro Split Official</div>
                <div className="text-[11px] text-purple-100">
                  {pc.currentOrgId ? `${pc.currentOrgTag} Official Series` : 'Sign with an Org first'}
                </div>
              </div>
              <span className="font-mono text-xs font-semibold shrink-0 ml-2">-25 EN</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Dumbbell size={14} className="text-blue-500" />
              Individual Practice Drills (-20 EN)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'skill', label: 'Mechanics' },
                  { id: 'consistency', label: 'Consistency' },
                  { id: 'teamwork', label: 'Comms / Macro' },
                  { id: 'pressure', label: 'Clutch Focus' },
                ] as const
              ).map((drill) => (
                <button
                  key={drill.id}
                  type="button"
                  disabled={state.energy < 20}
                  onClick={() => handleTrain(drill.id)}
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] hover:border-blue-500 disabled:opacity-45 text-xs font-semibold text-center transition-colors"
                >
                  {drill.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 8 Competitive & Popularity Attributes */}
        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" />
              Competitive &amp; Brand Profile
            </h3>
            <button
              type="button"
              onClick={onOpenPhone}
              className="text-xs font-semibold text-blue-500 hover:underline"
            >
              Grow Popularity on Phone →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributeList.map((attr) => {
              const val = pc.attributes[attr.key];
              return (
                <div key={attr.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{attr.label}</span>
                    <span className="font-mono font-bold tabular-nums">{val}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${attr.color}`}
                      style={{ width: `${Math.min(100, val)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Tryout Invites & Contract Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-500" />
            Tryout Invitations ({pendingTryouts.length})
          </h3>

          {pendingTryouts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No active tryout invites right now. Compete in Open Qualifiers or advance weeks to draw scout attention.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingTryouts.map((tr) => (
                <div
                  key={tr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        {tr.orgName} [{tr.orgTag}]
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Rep {tr.orgReputation} · {tr.isStarterGuaranteed ? 'Starting Spot' : 'Sub/Academy'} · Expires Wk {tr.expiresWeek}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-500">
                      ${tr.offeredSalaryUSD.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTryout(tr.id, true)}
                      className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      Attend Tryout
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTryout(tr.id, false)}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <X size={14} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 fm-panel p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-blue-500" />
            Contract Offers ({pendingOffers.length})
          </h3>

          {pendingOffers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct contract offers from rival GMs also arrive in your Messenger app as your rating and reputation climb.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingOffers.map((of) => (
                <div
                  key={of.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D121C] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        {of.orgName} [{of.orgTag}]
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {of.durationWeeks} wks · {of.isStarter ? 'Starter' : 'Bench'} · +${of.signingBonusUSD.toLocaleString()} bonus
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-blue-500">
                      ${of.monthlySalaryUSD.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleContract(of.id, 'accept')}
                      className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Sign Contract
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContract(of.id, 'negotiate')}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-500 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Handshake size={14} />
                      Negotiate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContract(of.id, 'reject')}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Career Decisions & Retirement into Ownership */}
      <section className="fm-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-violet-500" />
              Contract Decisions &amp; Legacy Transition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your current roster status or retire from active play to found your own esports club.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {pc.currentOrgId && (
              <>
                <button
                  type="button"
                  onClick={handleNegotiateRaise}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold"
                >
                  Negotiate +20% Raise
                </button>
                <button
                  type="button"
                  disabled={pc.transferRequested}
                  onClick={handleRequestTransfer}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 disabled:opacity-45 text-xs font-semibold"
                >
                  {pc.transferRequested ? 'Transfer Requested' : 'Request Transfer'}
                </button>
                <button
                  type="button"
                  onClick={handleLeaveOrg}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-semibold"
                >
                  Exit to Free Agency
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowRetireBox((v) => !v)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Building2 size={14} />
              Retire &amp; Found Esports Org
            </button>
          </div>
        </div>

        {pc.personalSponsors.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <Sparkles size={14} />
              Active Personal Endorsements
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pc.personalSponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                >
                  <span className="font-semibold">{sp.brandName}</span>
                  <span className="font-mono text-emerald-500">
                    +${sp.weeklyPayoutUSD}/wk · {sp.weeksRemaining}w
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRetireBox && (
          <form
            onSubmit={handleRetire}
            className="p-4 rounded-xl border border-violet-500/40 bg-violet-600/10 space-y-3"
          >
            <div className="flex items-start gap-2 text-xs text-slate-200">
              <Trophy size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                Retiring preserves your reputation, net worth, social following, and phone ecosystem while transitioning into full Organisation Owner management.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                maxLength={28}
                value={retireOrgName}
                onChange={(e) => setRetireOrgName(e.target.value)}
                placeholder="Organisation Name"
                className="sm:col-span-2 min-h-[42px] px-3 py-2 rounded-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 text-xs"
              />
              <input
                type="text"
                required
                maxLength={4}
                value={retireOrgTag}
                onChange={(e) => setRetireOrgTag(e.target.value.toUpperCase())}
                placeholder="TAG"
                className="min-h-[42px] px-3 py-2 rounded-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                Confirm Retirement &amp; Launch Org
              </button>
              <button
                type="button"
                onClick={() => setShowRetireBox(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
