import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Search,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { getCountryById } from '../data/countries';
import { ESPORTS_TITLES, getGameById } from '../data/esportsTitles';
import { FACILITY_TIERS, ORG_REGISTRATION_COSTS } from '../data/facilitiesAndStaff';
import { formatCurrency } from '../engine/economy';
import { computeTeamRating } from '../engine/matchEngine';
import { getEnergyCosts } from '../engine/weeklyEngine';
import {
  ActiveTournament,
  EsportsPlayer,
  GameState,
  OrgStrategy,
  OrgType,
  PlayerTier,
} from '../types/game';
import { ORG_STRATEGIES, ORG_TYPES } from '../engine/devAndSandbox';
import { OrgCrest } from './OrgCrest';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerProfileModal } from './PlayerProfileModal';
import tournamentArenaImg from '../assets/images/tournament_world_arena_1794780500054.jpg';

interface EsportsViewProps {
  state: GameState;
  onUpdateRegistrationField: (patch: Partial<GameState['registration']>) => void;
  onPayRegistrationStep: (
    step:
      | 'businessRegistered'
      | 'licenseAcquired'
      | 'legalDocsDone'
      | 'brandingDone'
      | 'marketingLaunchDone'
      | 'initialReserveDeposited',
    costUSD: number
  ) => void;
  onSubmitOrgRegistration: () => void;
  onOpenDivision: (gameId: string) => void;
  onTrainDivision: (gameId: string) => void;
  onPrepDivision: (gameId: string) => void;
  onToggleStarter: (playerId: string) => void;
  onSetCaptain: (playerId: string) => void;
  onRenewPlayer: (playerId: string) => void;
  onReleasePlayer: (playerId: string) => void;
  onScoutPlayer: (playerId: string) => void;
  onNegotiatePlayer: (playerId: string, offeredMonthlyUSD: number) => void;
  onEnterTournament: (tournamentId: string) => void;
  onLaunchMatchModal: (tournament: ActiveTournament) => void;
  onChangeOrgStrategy?: (orgType: OrgType, orgStrategy: OrgStrategy) => void;
  onCreatePaperTeam?: (gameId: string) => void;
}

type EsportsSubTab = 'divisions' | 'roster' | 'market' | 'tournaments';

export const EsportsView: React.FC<EsportsViewProps> = ({
  state,
  onUpdateRegistrationField,
  onPayRegistrationStep,
  onSubmitOrgRegistration,
  onOpenDivision,
  onTrainDivision,
  onPrepDivision,
  onToggleStarter,
  onSetCaptain,
  onRenewPlayer,
  onReleasePlayer,
  onScoutPlayer,
  onNegotiatePlayer,
  onEnterTournament,
  onLaunchMatchModal,
  onChangeOrgStrategy,
  onCreatePaperTeam,
}) => {
  const [subTab, setSubTab] = useState<EsportsSubTab>('divisions');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>(
    state.org.divisions[0]?.gameId ?? 'vanguard_protocol'
  );
  const [tierFilter, setTierFilter] = useState<PlayerTier | 'All'>('All');
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<EsportsPlayer | null>(null);
  const [salaryOfferUSD, setSalaryOfferUSD] = useState<number>(1000);
  const [profileModalPlayer, setProfileModalPlayer] = useState<{
    player: EsportsPlayer;
    isRoster: boolean;
  } | null>(null);
  const [arenaImgFailed, setArenaImgFailed] = useState(false);

  const country = getCountryById(state.character.countryId);
  const energyCosts = getEnergyCosts(state);
  const liquidPersonalUSD = state.finances.cashUSD + state.finances.bankBalanceUSD;

  const regMult = country.licenseCostMultiplier;
  const regSteps = [
    {
      key: 'businessRegistered' as const,
      label: 'Business Registration',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.businessRegistration * regMult),
      desc: 'Incorporate your legal entity with national commerce authorities.',
    },
    {
      key: 'licenseAcquired' as const,
      label: 'Esports Organization Licence',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.esportsLicense * regMult),
      desc: 'Obtain official competitive circuit eligibility and team license.',
    },
    {
      key: 'legalDocsDone' as const,
      label: 'Legal Documentation',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.legalDocs * regMult),
      desc: 'Player contract templates, NDA compliance, and tax ID filing.',
    },
    {
      key: 'brandingDone' as const,
      label: 'Branding & Identity',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.branding * regMult),
      desc: 'Finalize team name, competitive tag, crest emblem, and jersey palette.',
    },
    {
      key: 'marketingLaunchDone' as const,
      label: 'Marketing Launch',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.marketingLaunch * regMult),
      desc: 'Announce your organization to press and social channels.',
    },
    {
      key: 'initialReserveDeposited' as const,
      label: 'Initial Operational Reserve',
      costUSD: Math.round(ORG_REGISTRATION_COSTS.operationalReserve * regMult),
      desc: 'Mandatory $10K base capital deposit seeded directly into your Org Bank.',
    },
  ];

  const allStepsPaid =
    state.registration.businessRegistered &&
    state.registration.licenseAcquired &&
    state.registration.legalDocsDone &&
    state.registration.brandingDone &&
    state.registration.marketingLaunchDone &&
    state.registration.initialReserveDeposited;

  const currentFacility = FACILITY_TIERS.find((f) => f.level === state.org.facilityLevel);
  const maxDivisions =
    state.isSandbox || state.org.internationalExpansionUnlocked || state.devOverrides?.unlockAllFeatures
      ? Math.max(ESPORTS_TITLES.length, (currentFacility?.maxDivisions ?? 1) + (state.org.bonusRosterSlots ?? 0))
      : (currentFacility?.maxDivisions ?? 1) + (state.org.bonusRosterSlots ?? 0);

  const filteredMarket = useMemo(() => {
    return state.marketPlayers
      .filter((p) => (selectedGameFilter === 'All' ? true : p.gameId === selectedGameFilter))
      .filter((p) => (tierFilter === 'All' ? true : p.tier === tierFilter))
      .sort((a, b) => b.overall - a.overall);
  }, [state.marketPlayers, selectedGameFilter, tierFilter]);

  /* ---------------- Pre-Founding Organization Registration ---------------- */
  if (!state.org.founded) {
    return (
      <div className="space-y-6">
        <section className="fm-panel-elevated p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-blue-500">
                Organization Founding · {country.name}
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                Establish Your Esports Organization
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Complete all six regulatory and startup steps using personal savings, then file your charter (60 energy).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Available Personal Funds</div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-500">
                {formatCurrency(liquidPersonalUSD, state.character.countryId)}
              </div>
            </div>
          </div>

          {state.registration.approvalWeeksRemaining > 0 ? (
            <div className="p-6 rounded-xl border border-blue-500/40 bg-blue-600/10 space-y-2">
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Charter Under Regulatory Review
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{state.registration.proposedName}</strong> [{state.registration.proposedTag}] has cleared all
                filings. Official approval completes in{' '}
                <strong className="font-mono text-blue-500">
                  {state.registration.approvalWeeksRemaining} week(s)
                </strong>
                . Advance the week to launch operations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              {/* Brand Identity Studio */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Club Branding Studio
                </h3>
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <OrgCrest
                    name={state.registration.proposedName || 'Esports Org'}
                    tag={state.registration.proposedTag || 'ESP'}
                    color={state.registration.proposedColor}
                    icon={state.registration.proposedIcon}
                    size="xl"
                  />
                  <div>
                    <div className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      {state.registration.proposedName || 'Unnamed Org'}
                    </div>
                    <div className="font-mono text-xs text-blue-500">
                      [{state.registration.proposedTag || 'TAG'}] · {state.character.city}
                    </div>
                  </div>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Organization Name</span>
                  <input
                    type="text"
                    maxLength={28}
                    value={state.registration.proposedName}
                    onChange={(e) => onUpdateRegistrationField({ proposedName: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">3–4 Letter Tag</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={state.registration.proposedTag}
                      onChange={(e) =>
                        onUpdateRegistrationField({ proposedTag: e.target.value.toUpperCase() })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono uppercase"
                    />
                  </label>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Club Color</span>
                    <div className="flex items-center gap-2 min-h-[44px]">
                      {['#2563EB', '#7C3AED', '#0F766E', '#DC2626', '#D97706', '#334155'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => onUpdateRegistrationField({ proposedColor: col })}
                          className={`w-7 h-7 rounded-lg transition-transform ${
                            state.registration.proposedColor === col
                              ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                              : ''
                          }`}
                          style={{ backgroundColor: col }}
                          aria-label={`Select color ${col}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Crest Emblem</span>
                  <div className="grid grid-cols-6 gap-2">
                    {(['shield', 'crown', 'flame', 'zap', 'target', 'award'] as const).map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => onUpdateRegistrationField({ proposedIcon: ic })}
                        className={`min-h-[42px] rounded-lg border text-xs capitalize font-medium ${
                          state.registration.proposedIcon === ic
                            ? 'border-blue-500 bg-blue-600/15 text-blue-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6 Registration Steps */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Licensing &amp; Capital Checklist
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C]">
                  {regSteps.map((step) => {
                    const done = state.registration[step.key];
                    const canPay = liquidPersonalUSD >= step.costUSD;
                    return (
                      <div
                        key={step.key}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {step.label}
                            </span>
                            {done && <CheckCircle2 size={15} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={done || !canPay}
                          onClick={() => onPayRegistrationStep(step.key, step.costUSD)}
                          className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            done
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : canPay
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {done ? 'Completed' : formatCurrency(step.costUSD, state.character.countryId)}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!allStepsPaid || state.energy < 60}
                  onClick={onSubmitOrgRegistration}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-35 text-white font-display font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                  Submit Organization Charter (-60 Energy)
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ---------------- Founded Organization Esports Console ---------------- */
  return (
    <div className="space-y-6">
      {/* Club Branding Header */}
      <section className="fm-panel-elevated p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <OrgCrest
              name={state.org.name}
              tag={state.org.tag}
              color={state.org.color}
              icon={state.org.icon}
              size="xl"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-blue-500 font-medium">
                <span>[{state.org.tag}]</span>
                <span aria-hidden="true">·</span>
                <span>{state.org.headquarters}</span>
                <span aria-hidden="true">·</span>
                <span>{currentFacility?.name ?? 'Small Office'}</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {state.org.name}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Org Bank</div>
              <div className="font-mono font-bold tabular-nums">
                {formatCurrency(state.org.bankBalanceUSD, state.character.countryId, true)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Reputation</div>
              <div className="font-mono font-bold tabular-nums text-blue-500">{state.org.reputation}/100</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Divisions</div>
              <div className="font-mono font-bold tabular-nums">
                {state.org.divisions.length}/{maxDivisions}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Trophies</div>
              <div className="font-mono font-bold tabular-nums text-amber-500">{state.org.trophies.length}</div>
            </div>
          </div>
        </div>

        {/* Strategy & Sandbox/Unlocked Controls */}
        {(state.isSandbox ||
          state.devOverrides?.unlockAllFeatures ||
          state.org.paperTeamUnlocked ||
          state.org.internationalExpansionUnlocked ||
          state.org.orgType) && (
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {onChangeOrgStrategy && (
                <>
                  <select
                    aria-label="Organization Type"
                    value={state.org.orgType ?? 'Standard'}
                    onChange={(e) =>
                      onChangeOrgStrategy(e.target.value as OrgType, state.org.orgStrategy ?? 'Balanced')
                    }
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-medium"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        Type: {t.id}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Organization Strategy"
                    value={state.org.orgStrategy ?? 'Balanced'}
                    onChange={(e) =>
                      onChangeOrgStrategy(state.org.orgType ?? 'Standard', e.target.value as OrgStrategy)
                    }
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-medium"
                  >
                    {ORG_STRATEGIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        Strategy: {s.id}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {state.org.orgXp !== undefined && (
                <span className="font-mono text-xs text-purple-400 tabular-nums px-2">
                  Org XP: {state.org.orgXp.toLocaleString()}
                </span>
              )}
              {state.org.internationalExpansionUnlocked && (
                <span className="text-xs text-emerald-400 font-medium px-1">
                  Global Expansion Active
                </span>
              )}
            </div>

            {(state.org.paperTeamUnlocked || state.isSandbox || state.devOverrides?.unlockAllFeatures) &&
              onCreatePaperTeam && (
                <button
                  type="button"
                  onClick={() => onCreatePaperTeam(selectedGameFilter === 'All' ? 'vanguard_protocol' : selectedGameFilter)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Create Paper Team ({getGameById(selectedGameFilter === 'All' ? 'vanguard_protocol' : selectedGameFilter).name})
                </button>
              )}
          </div>
        )}

        {/* Sub-tab Controls */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'divisions', label: 'Divisions & Tactics' },
              { id: 'roster', label: 'Squad & Profiles' },
              { id: 'market', label: 'Scouting & Transfers' },
              { id: 'tournaments', label: 'Tournaments & Arena' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                subTab === t.id
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* SUBTAB 1: DIVISIONS & TACTICS */}
      {subTab === 'divisions' && (
        <div className="space-y-6">
          {state.org.divisions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.org.divisions.map((div) => {
                const game = getGameById(div.gameId);
                const divPlayers = state.roster.filter((p) => p.gameId === div.gameId);
                const starters = divPlayers.filter((p) => p.isStarter);
                const rating = Math.round(computeTeamRating(starters, div, state));

                return (
                  <div
                    key={div.gameId}
                    className="fm-panel p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-blue-500 font-medium">
                          {game.genre} · {game.rosterSize}v{game.rosterSize} · World Rank #{div.worldRank}
                        </div>
                        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                          {game.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xl font-extrabold tabular-nums text-blue-500">
                          {starters.length >= game.rosterSize ? `${rating} OVR` : 'Incomplete'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {starters.length}/{game.rosterSize} Starters
                        </div>
                      </div>
                    </div>

                    {/* Starting Lineup Strip */}
                    {starters.length > 0 && (
                      <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                        {starters.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => setProfileModalPlayer({ player: sp, isRoster: true })}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 hover:border-blue-500 shrink-0 text-left transition-colors"
                          >
                            <PlayerAvatar id={sp.id} ign={sp.ign} size="sm" highlight={sp.isCaptain} />
                            <div>
                              <div className="font-display text-xs font-bold">{sp.ign}</div>
                              <div className="font-mono text-[10px] text-blue-500">{sp.overall} OVR</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Chemistry</span>
                        <span className="font-mono font-bold text-sm tabular-nums">{div.chemistry}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tactical Prep</span>
                        <span className="font-mono font-bold text-sm tabular-nums">{div.tacticalPrep}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Record</span>
                        <span className="font-mono font-bold text-sm tabular-nums">
                          {div.wins}W – {div.losses}L
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={div.trainedThisWeek || state.energy < energyCosts.training}
                        onClick={() => onTrainDivision(div.gameId)}
                        className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        {div.trainedThisWeek ? 'Trained This Week' : `Run Scrims (-${energyCosts.training} EN)`}
                      </button>
                      <button
                        type="button"
                        disabled={state.energy < energyCosts.tournamentPrep}
                        onClick={() => onPrepDivision(div.gameId)}
                        className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-purple-500 disabled:opacity-40 text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        Tactical Prep (-{energyCosts.tournamentPrep} EN)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Expand into new game titles */}
          <section className="fm-panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Esports Game Circuits (11 Titles)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current facility capacity: {state.org.divisions.length}/{maxDivisions} divisions. Upgrade facilities in Business to expand.
                </p>
              </div>
              <div className="font-mono text-xs text-blue-500 font-semibold">
                Division License: {formatCurrency(2500, state.character.countryId)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ESPORTS_TITLES.map((game) => {
                const opened = state.org.divisions.some((d) => d.gameId === game.id);
                const canOpen =
                  !opened &&
                  state.org.divisions.length < maxDivisions &&
                  state.org.bankBalanceUSD >= 2500;
                return (
                  <div
                    key={game.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[11px] text-slate-500">
                        {game.genre} · {game.rosterSize}v{game.rosterSize} · Pop {game.globalPopularity}
                      </div>
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                        {game.name}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{game.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={opened || !canOpen}
                      onClick={() => {
                        onOpenDivision(game.id);
                        setSelectedGameFilter(game.id);
                      }}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        opened
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : canOpen
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {opened ? 'Active' : state.org.divisions.length >= maxDivisions ? 'Full' : 'Open'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SUBTAB 2: SQUAD & ATHLETE PROFILES */}
      {subTab === 'roster' && (
        <section className="fm-panel p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Active Roster &amp; Athlete Profiles ({state.roster.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any athlete card to open their full scouting dossier, attribute radar, and contract controls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('market')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold whitespace-nowrap"
            >
              Scout Market
            </button>
          </div>

          {state.roster.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No players contracted yet. Open a game division and visit Scouting &amp; Transfers to build your squad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.roster.map((player) => {
                const game = getGameById(player.gameId);
                return (
                  <div
                    key={player.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition-colors space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileModalPlayer({ player, isRoster: true })}
                        className="flex items-center gap-3.5 text-left min-w-0 group"
                      >
                        <PlayerAvatar
                          id={player.id}
                          ign={player.ign}
                          overall={player.overall}
                          size="lg"
                          highlight={player.isCaptain}
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] text-blue-500 font-medium truncate">
                            {game.name} · {player.role} {player.isCaptain ? '· Captain' : ''}
                          </div>
                          <div className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                            {player.ign}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {player.realName} · {player.nationality}
                          </div>
                        </div>
                      </button>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-semibold text-emerald-500">
                          {formatCurrency(player.monthlySalaryUSD, state.character.countryId)}/mo
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {player.contractWeeksLeft} wks left
                        </div>
                      </div>
                    </div>

                    {/* Key FM Attribute Strip */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-200/70 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block">MECH</span>
                        <strong>{player.attributes.mechanicalSkill}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">SENSE</span>
                        <strong>{player.attributes.gameSense}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">MORALE</span>
                        <strong className="text-emerald-500">{player.morale}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">FORM</span>
                        <strong className="text-blue-500">{player.form}%</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStarter(player.id)}
                        className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          player.isStarter
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {player.isStarter ? 'Starter' : 'Substitute'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileModalPlayer({ player, isRoster: true })}
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-500 hover:bg-blue-600/25 text-xs font-semibold"
                      >
                        Full Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUBTAB 3: SCOUTING & TRANSFERS */}
      {subTab === 'market' && (
        <section className="fm-panel p-6 space-y-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search size={18} className="text-blue-500" />
              Scouting Network &amp; Free Agency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect athlete dossiers, unlock full scouting reports, and submit contract salary proposals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm"
            >
              <option value="All">All Esports Titles</option>
              {ESPORTS_TITLES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.genre})
                </option>
              ))}
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as PlayerTier | 'All')}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm"
            >
              <option value="All">All Recruitment Tiers</option>
              <option value="Amateur">Amateur</option>
              <option value="Semi-professional">Semi-professional</option>
              <option value="Professional">Professional</option>
              <option value="Established professional">Established professional</option>
              <option value="Superstar">Superstar</option>
              <option value="International legend">International legend</option>
            </select>
          </div>

          {negotiatingPlayer && (
            <div className="p-5 rounded-xl border border-blue-500/40 bg-blue-600/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    id={negotiatingPlayer.id}
                    ign={negotiatingPlayer.ign}
                    size="md"
                  />
                  <div>
                    <div className="text-xs text-blue-400 font-medium">
                      Contract Table · {getGameById(negotiatingPlayer.gameId).name}
                    </div>
                    <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {negotiatingPlayer.ign} ({negotiatingPlayer.tier})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      Asking:{' '}
                      <strong className="font-mono">
                        {formatCurrency(negotiatingPlayer.monthlySalaryUSD, state.character.countryId)}/mo
                      </strong>{' '}
                      · Signing Bonus:{' '}
                      <strong className="font-mono">
                        {formatCurrency(Math.round(salaryOfferUSD * 0.5), state.character.countryId)}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNegotiatingPlayer(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Proposed Monthly Salary</span>
                  <span className="font-mono font-bold text-sm text-blue-400">
                    {formatCurrency(salaryOfferUSD, state.character.countryId)} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.round(negotiatingPlayer.monthlySalaryUSD * 0.7)}
                  max={Math.round(negotiatingPlayer.monthlySalaryUSD * 1.4)}
                  step={50}
                  value={salaryOfferUSD}
                  onChange={(e) => setSalaryOfferUSD(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <button
                type="button"
                disabled={state.energy < energyCosts.contractNegotiation}
                onClick={() => {
                  onNegotiatePlayer(negotiatingPlayer.id, salaryOfferUSD);
                  setNegotiatingPlayer(null);
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold disabled:opacity-40"
              >
                Submit Contract Offer (-{energyCosts.contractNegotiation} EN)
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMarket.slice(0, 24).map((p) => {
              const game = getGameById(p.gameId);
              const hasDivision = state.org.divisions.some((d) => d.gameId === p.gameId);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileModalPlayer({ player: p, isRoster: false })}
                      className="flex items-center gap-3 text-left min-w-0 group"
                    >
                      <PlayerAvatar
                        id={p.id}
                        ign={p.ign}
                        overall={p.scouted ? p.overall : undefined}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-500 truncate">
                          {game.name} · {p.tier}
                        </div>
                        <div className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                          {p.ign} <span className="text-xs font-normal text-slate-500">({p.age})</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 tabular-nums">
                          {p.scouted
                            ? `OVR ${p.overall} · POT ${p.attributes.potential}`
                            : `Est. ${Math.max(40, p.overall - 6)}–${Math.min(99, p.overall + 5)}`}
                        </div>
                      </div>
                    </button>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-emerald-500">
                        {formatCurrency(p.monthlySalaryUSD, state.character.countryId, true)}/mo
                      </div>
                      <div className="text-[11px] text-slate-500">{p.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!p.scouted && (
                      <button
                        type="button"
                        disabled={state.energy < energyCosts.scouting}
                        onClick={() => onScoutPlayer(p.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-blue-500 disabled:opacity-40 text-xs font-semibold"
                      >
                        Scout (-{energyCosts.scouting} EN)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setProfileModalPlayer({ player: p, isRoster: false })}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Dossier
                    </button>
                    <button
                      type="button"
                      disabled={!hasDivision}
                      onClick={() => {
                        setNegotiatingPlayer(p);
                        setSalaryOfferUSD(p.monthlySalaryUSD);
                      }}
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-35 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <UserPlus size={13} />
                      {hasDivision ? 'Offer' : 'Need Div.'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUBTAB 4: TOURNAMENTS & ARENA */}
      {subTab === 'tournaments' && (
        <div className="space-y-6">
          {/* Tournament Arena Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[170px] bg-[#0D121C]">
            {!arenaImgFailed && (
              <img
                src={tournamentArenaImg}
                alt="Championship tournament stage"
                referrerPolicy="no-referrer"
                onError={() => setArenaImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/85 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div className="space-y-1 max-w-xl">
                <div className="text-xs font-semibold text-blue-400">
                  7-Tier Competitive Ecosystem · Local to Annual World Championship
                </div>
                <h3 className="font-display text-2xl font-extrabold">
                  Tournament Circuits &amp; Matchday Center
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Register active rosters, climb global division rankings, and command tactical match strategies.
                </p>
              </div>
              <div className="font-mono text-xs bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 shrink-0">
                Club Trophies: <strong className="text-amber-300 text-sm">{state.org.trophies.length}</strong>
              </div>
            </div>
          </div>

          <section className="fm-panel p-6 space-y-4">
            {state.org.divisions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">
                Open a division and assign starters before entering competitive tournaments.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.tournaments
                  .filter(
                    (t) =>
                      t.status !== 'Completed' &&
                      state.org.divisions.some((d) => d.gameId === t.gameId)
                  )
                  .map((trn) => {
                    const game = getGameById(trn.gameId);
                    const div = state.org.divisions.find((d) => d.gameId === trn.gameId)!;
                    const starters = state.roster.filter(
                      (p) => p.gameId === trn.gameId && p.isStarter
                    );
                    const hasFullRoster = starters.length >= game.rosterSize;
                    const meetsRank =
                      Boolean(state.isSandbox || state.devOverrides?.unlockAllTournaments) ||
                      div.rankingPoints >= trn.minRankPoints;
                    const entered = trn.status === 'In Progress';

                    return (
                      <div
                        key={trn.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                          entered
                            ? 'border-blue-500/60 bg-blue-600/10'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-purple-500">{trn.tier}</span>
                            <span className="font-mono">
                              Rd {trn.round}/{trn.maxRounds}
                            </span>
                          </div>
                          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                            {trn.name}
                          </div>
                          <div className="text-xs text-slate-500">{game.name}</div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <div className="text-xs font-mono tabular-nums">
                            <div className="text-emerald-500 font-bold">
                              Pool {formatCurrency(trn.prizePoolUSD, state.character.countryId, true)}
                            </div>
                            <div className="text-slate-500">
                              Fee {formatCurrency(trn.entryFeeUSD, state.character.countryId)} · Req {trn.minRankPoints} pts
                            </div>
                          </div>

                          {entered ? (
                            <button
                              type="button"
                              disabled={!hasFullRoster}
                              onClick={() => onLaunchMatchModal(trn)}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Swords size={15} />
                              Play Match
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                !hasFullRoster ||
                                !meetsRank ||
                                state.org.bankBalanceUSD < trn.entryFeeUSD
                              }
                              onClick={() => onEnterTournament(trn.id)}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap"
                            >
                              {!hasFullRoster
                                ? `Need ${game.rosterSize} Starters`
                                : !meetsRank
                                ? `Need ${trn.minRankPoints} Pts`
                                : 'Register'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {state.recentMatches.length > 0 && (
            <section className="fm-panel p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Recent Match Results
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.recentMatches.slice(0, 8).map((m) => (
                  <div key={m.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Week {m.week} · {m.tournamentName} · {m.mapName}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          m.won ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {m.won ? 'WIN' : 'LOSS'} {m.scoreLine}
                      </span>
                    </div>
                    <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                      {state.org.name} vs {m.opponentName} · MVP: {m.mvpIgn} ({m.mvpRating})
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {m.narrative[m.narrative.length - 1]}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* FM-Style Player Profile Modal */}
      {profileModalPlayer && (
        <PlayerProfileModal
          player={profileModalPlayer.player}
          countryId={state.character.countryId}
          isRosterPlayer={profileModalPlayer.isRoster}
          energyLeft={state.energy}
          negotiationCost={energyCosts.contractNegotiation}
          scoutingCost={energyCosts.scouting}
          hasDivision={state.org.divisions.some((d) => d.gameId === profileModalPlayer.player.gameId)}
          onClose={() => setProfileModalPlayer(null)}
          onToggleStarter={(id) => {
            onToggleStarter(id);
            setProfileModalPlayer(null);
          }}
          onSetCaptain={(id) => {
            onSetCaptain(id);
            setProfileModalPlayer(null);
          }}
          onRenew={(id) => {
            onRenewPlayer(id);
            setProfileModalPlayer(null);
          }}
          onRelease={onReleasePlayer}
          onScout={(id) => {
            onScoutPlayer(id);
            setProfileModalPlayer((prev) =>
              prev ? { ...prev, player: { ...prev.player, scouted: true } } : null
            );
          }}
          onStartNegotiation={(p) => {
            setNegotiatingPlayer(p);
            setSalaryOfferUSD(p.monthlySalaryUSD);
          }}
        />
      )}
    </div>
  );
};
