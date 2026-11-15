import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crosshair,
  Search,
  Shield,
  Sliders,
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
  PlayerTier,
} from '../types/game';
import { OrgCrest } from './OrgCrest';

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
}) => {
  const [subTab, setSubTab] = useState<EsportsSubTab>('divisions');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>(
    state.org.divisions[0]?.gameId ?? 'vanguard_protocol'
  );
  const [tierFilter, setTierFilter] = useState<PlayerTier | 'All'>('All');
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<EsportsPlayer | null>(null);
  const [salaryOfferUSD, setSalaryOfferUSD] = useState<number>(1000);
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);

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
      desc: 'Announce your organization to local press and social channels.',
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
  const maxDivisions = currentFacility?.maxDivisions ?? 1;

  const filteredMarket = useMemo(() => {
    return state.marketPlayers
      .filter((p) => (selectedGameFilter === 'All' ? true : p.gameId === selectedGameFilter))
      .filter((p) => (tierFilter === 'All' ? true : p.tier === tierFilter))
      .sort((a, b) => b.overall - a.overall);
  }, [state.marketPlayers, selectedGameFilter, tierFilter]);

  if (!state.org.founded) {
    return (
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Milestone · Organization Founding ({country.name})
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Establish Your Esports Organization
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Complete all six regulatory and startup steps using your personal savings, then submit your charter
                for review (60 energy).
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Available Personal Funds</div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(liquidPersonalUSD, state.character.countryId)}
              </div>
            </div>
          </div>

          {state.registration.approvalWeeksRemaining > 0 ? (
            <div className="p-6 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 space-y-2">
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Application Under Regulatory Review
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{state.registration.proposedName}</strong> ({state.registration.proposedTag}) has cleared all
                filings. Official approval completes in{' '}
                <strong className="font-mono">{state.registration.approvalWeeksRemaining} week(s)</strong>. Advance the
                week to launch operations.
              </p>
            </div>
          ) : (
            <>
              {/* Brand Identity Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Organization Identity
                  </h3>
                  <div className="flex items-center gap-4">
                    <OrgCrest
                      name={state.registration.proposedName || 'Esports Org'}
                      tag={state.registration.proposedTag || 'ESP'}
                      color={state.registration.proposedColor}
                      icon={state.registration.proposedIcon}
                      size="lg"
                    />
                    <div className="text-sm">
                      <div className="font-display font-bold text-slate-900 dark:text-white">
                        {state.registration.proposedName || 'Unnamed Org'}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
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
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
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
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono uppercase"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Brand Color</span>
                      <div className="flex items-center gap-2 min-h-[44px]">
                        {['#2563EB', '#0F766E', '#B91C1C', '#D97706', '#4338CA', '#0F172A'].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => onUpdateRegistrationField({ proposedColor: col })}
                            className={`w-7 h-7 rounded-lg transition-transform ${
                              state.registration.proposedColor === col ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''
                            }`}
                            style={{ backgroundColor: col }}
                            aria-label={`Select color ${col}`}
                          />
                        ))}
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Crest Emblem</span>
                    <div className="grid grid-cols-6 gap-2">
                      {(['shield', 'crown', 'flame', 'zap', 'target', 'award'] as const).map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => onUpdateRegistrationField({ proposedIcon: ic })}
                          className={`min-h-[44px] rounded-lg border text-xs capitalize font-medium ${
                            state.registration.proposedIcon === ic
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
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
                    Licensing & Capital Checklist
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
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
                              {done && <CheckCircle2 size={15} className="text-emerald-600" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                          </div>
                          <button
                            type="button"
                            disabled={done || !canPay}
                            onClick={() => onPayRegistrationStep(step.key, step.costUSD)}
                            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors ${
                              done
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                : canPay
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white'
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
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-display font-semibold text-sm transition-colors"
                  >
                    Submit Organization Charter (-60 Energy)
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  // Founded Organization Esports Console
  return (
    <div className="space-y-6">
      {/* Org Header Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <OrgCrest
              name={state.org.name}
              tag={state.org.tag}
              color={state.org.color}
              icon={state.org.icon}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>[{state.org.tag}]</span>
                <span aria-hidden="true">·</span>
                <span>{state.org.headquarters}</span>
                <span aria-hidden="true">·</span>
                <span>{currentFacility?.name ?? 'Small Office'}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {state.org.name}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Org Bank</div>
              <div className="font-mono font-semibold tabular-nums">
                {formatCurrency(state.org.bankBalanceUSD, state.character.countryId, true)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Reputation</div>
              <div className="font-mono font-semibold tabular-nums">{state.org.reputation}/100</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Divisions</div>
              <div className="font-mono font-semibold tabular-nums">
                {state.org.divisions.length}/{maxDivisions}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Trophies</div>
              <div className="font-mono font-semibold tabular-nums">{state.org.trophies.length}</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'divisions', label: 'Divisions & Training' },
              { id: 'roster', label: 'Roster & Contracts' },
              { id: 'market', label: 'Scouting & Market' },
              { id: 'tournaments', label: 'Tournaments & Match' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                subTab === t.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* SUBTAB 1: DIVISIONS & TRAINING */}
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
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {game.genre} · {game.rosterSize}v{game.rosterSize} · World Rank #{div.worldRank}
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {game.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold tabular-nums text-blue-600">
                          {starters.length >= game.rosterSize ? `${rating} OVR` : 'Incomplete'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {starters.length}/{game.rosterSize} Starters
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Chemistry</span>
                        <span className="font-mono font-semibold text-sm tabular-nums">{div.chemistry}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tactical Prep</span>
                        <span className="font-mono font-semibold text-sm tabular-nums">{div.tacticalPrep}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Record</span>
                        <span className="font-mono font-semibold text-sm tabular-nums">
                          {div.wins}W – {div.losses}L
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        disabled={div.trainedThisWeek || state.energy < energyCosts.training}
                        onClick={() => onTrainDivision(div.gameId)}
                        className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        {div.trainedThisWeek ? 'Trained This Week' : `Run Scrims (-${energyCosts.training} EN)`}
                      </button>
                      <button
                        type="button"
                        disabled={state.energy < energyCosts.tournamentPrep}
                        onClick={() => onPrepDivision(div.gameId)}
                        className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 disabled:opacity-40 text-xs font-semibold whitespace-nowrap transition-colors"
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
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Esports Game Circuits (11 Titles)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your current facility supports up to {maxDivisions} active division(s). Upgrade facilities in Business to expand.
                </p>
              </div>
              <div className="font-mono text-xs text-slate-500">
                Entry Fee: {formatCurrency(2500, state.character.countryId)} Org Bank
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {ESPORTS_TITLES.map((game) => {
                const opened = state.org.divisions.some((d) => d.gameId === game.id);
                const canOpen =
                  !opened &&
                  state.org.divisions.length < maxDivisions &&
                  state.org.bankBalanceUSD >= 2500;
                return (
                  <div
                    key={game.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {game.genre} · {game.rosterSize}-Player Starting Roster · Popularity {game.globalPopularity}/100
                      </div>
                      <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                        {game.name}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{game.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={opened || !canOpen}
                      onClick={() => {
                        onOpenDivision(game.id);
                        setSelectedGameFilter(game.id);
                      }}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        opened
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : canOpen
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {opened ? 'Division Active' : state.org.divisions.length >= maxDivisions ? 'Facility Full' : 'Open Division'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SUBTAB 2: ROSTER & CONTRACTS */}
      {subTab === 'roster' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Contracted Roster ({state.roster.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign starters, appoint your team captain, monitor morale, and manage contracts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('market')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
            >
              Recruit Players
            </button>
          </div>

          {state.roster.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No players signed yet. Open a game division and visit Scouting &amp; Market to build your lineup.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.roster.map((player) => {
                const game = getGameById(player.gameId);
                const isExpanded = inspectedPlayerId === player.id;
                return (
                  <div
                    key={player.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{game.name}</span>
                          <span aria-hidden="true">·</span>
                          <span>{player.role}</span>
                          <span aria-hidden="true">·</span>
                          <span>{player.tier}</span>
                          {player.isCaptain && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">Team Captain</span>
                            </>
                          )}
                        </div>
                        <div className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{player.ign}</span>
                          <span className="text-xs font-normal text-slate-500">
                            ({player.realName}, Age {player.age})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          <span>OVR {player.overall}</span>
                          <span>POT {player.attributes.potential}</span>
                          <span>Morale {player.morale}%</span>
                          <span>{formatCurrency(player.monthlySalaryUSD, state.character.countryId)}/mo</span>
                          <span>{player.contractWeeksLeft} wks left</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleStarter(player.id)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            player.isStarter
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {player.isStarter ? 'Starter' : 'Substitute'}
                        </button>
                        <button
                          type="button"
                          disabled={player.isCaptain}
                          onClick={() => onSetCaptain(player.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-medium"
                        >
                          {player.isCaptain ? 'Captain' : 'Make Captain'}
                        </button>
                        <button
                          type="button"
                          disabled={state.energy < energyCosts.contractNegotiation}
                          onClick={() => onRenewPlayer(player.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-medium"
                        >
                          Renew (-{energyCosts.contractNegotiation} EN)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectedPlayerId(isExpanded ? null : player.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                        >
                          {isExpanded ? 'Hide Stats' : 'Attributes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onReleasePlayer(player.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          Release
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono tabular-nums">
                        <div>Mechanical: <strong>{player.attributes.mechanicalSkill}</strong></div>
                        <div>Game Sense: <strong>{player.attributes.gameSense}</strong></div>
                        <div>Comms: <strong>{player.attributes.communication}</strong></div>
                        <div>Consistency: <strong>{player.attributes.consistency}</strong></div>
                        <div>Experience: <strong>{player.attributes.experience}</strong></div>
                        <div>Potential: <strong>{player.attributes.potential}</strong></div>
                        <div>Discipline: <strong>{player.attributes.discipline}</strong></div>
                        <div>Adaptability: <strong>{player.attributes.adaptability}</strong></div>
                        <div>Mental: <strong>{player.attributes.mentalStrength}</strong></div>
                        <div>Reputation: <strong>{player.attributes.reputation}</strong></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUBTAB 3: SCOUTING & RECRUITMENT */}
      {subTab === 'market' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-blue-600" />
                Player Scouting &amp; Free Agency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scout prospects to reveal full ratings, then negotiate salary offers. Superstars require strong org reputation and facilities.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
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
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
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

          {/* Negotiation Panel */}
          {negotiatingPlayer && (
            <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Contract Negotiation · {getGameById(negotiatingPlayer.gameId).name}
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {negotiatingPlayer.ign} ({negotiatingPlayer.tier})
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Asking Monthly Salary:{' '}
                    <strong className="font-mono">
                      {formatCurrency(negotiatingPlayer.monthlySalaryUSD, state.character.countryId)}
                    </strong>{' '}
                    · Signing Fee:{' '}
                    <strong className="font-mono">
                      {formatCurrency(Math.round(negotiatingPlayer.monthlySalaryUSD * 0.5), state.character.countryId)}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNegotiatingPlayer(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Your Monthly Salary Offer</span>
                  <span className="font-mono font-bold text-sm">
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
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={state.energy < energyCosts.contractNegotiation}
                  onClick={() => {
                    onNegotiatePlayer(negotiatingPlayer.id, salaryOfferUSD);
                    setNegotiatingPlayer(null);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold"
                >
                  Submit Contract Offer (-{energyCosts.contractNegotiation} EN)
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMarket.slice(0, 24).map((p) => {
              const game = getGameById(p.gameId);
              const hasDivision = state.org.divisions.some((d) => d.gameId === p.gameId);

              return (
                <div
                  key={p.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{game.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.tier}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.role}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.nationality}</span>
                    </div>
                    <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                      {p.ign}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        (Age {p.age})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {p.scouted ? (
                        <>
                          <span>OVR {p.overall}</span>
                          <span>Mech {p.attributes.mechanicalSkill}</span>
                          <span>Sense {p.attributes.gameSense}</span>
                          <span>Pot {p.attributes.potential}</span>
                        </>
                      ) : (
                        <span>Est. OVR {Math.max(40, p.overall - 6)}–{Math.min(99, p.overall + 5)} (Unscouted)</span>
                      )}
                      <span>
                        Demand: {formatCurrency(p.monthlySalaryUSD, state.character.countryId)}/mo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!p.scouted && (
                      <button
                        type="button"
                        disabled={state.energy < energyCosts.scouting}
                        onClick={() => onScoutPlayer(p.id)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 disabled:opacity-40 text-xs font-semibold whitespace-nowrap"
                      >
                        Scout (-{energyCosts.scouting} EN)
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!hasDivision}
                      onClick={() => {
                        setNegotiatingPlayer(p);
                        setSalaryOfferUSD(p.monthlySalaryUSD);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      {hasDivision ? 'Offer Contract' : 'Open Division First'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUBTAB 4: TOURNAMENTS & MATCH */}
      {subTab === 'tournaments' && (
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy size={18} className="text-blue-600" />
                Competitive Circuits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your active divisions into tournaments from Local Cups to the Annual World Championship.
              </p>
            </div>

            {state.org.divisions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">
                Open a division and fill your starting lineup before entering tournaments.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    const meetsRank = div.rankingPoints >= trn.minRankPoints;
                    const entered = trn.status === 'In Progress';

                    return (
                      <div
                        key={trn.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{trn.tier}</span>
                            <span aria-hidden="true">·</span>
                            <span>{game.name}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Round {trn.round}/{trn.maxRounds}
                            </span>
                          </div>
                          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                            {trn.name}
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            <span>
                              Prize Pool: {formatCurrency(trn.prizePoolUSD, state.character.countryId)}
                            </span>
                            <span>
                              Entry: {formatCurrency(trn.entryFeeUSD, state.character.countryId)}
                            </span>
                            <span>Req Rank Pts: {trn.minRankPoints} (Yours: {div.rankingPoints})</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {entered ? (
                            <button
                              type="button"
                              disabled={!hasFullRoster}
                              onClick={() => onLaunchMatchModal(trn)}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Swords size={15} />
                              Play Match (Round {trn.round})
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
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap"
                            >
                              {!hasFullRoster
                                ? `Need ${game.rosterSize} Starters`
                                : !meetsRank
                                ? `Need ${trn.minRankPoints} Pts`
                                : 'Register Squad'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Recent Match Reports */}
          {state.recentMatches.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Recent Match Reports
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.recentMatches.slice(0, 8).map((m) => (
                  <div key={m.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Week {m.week} · {m.tournamentName} · {m.mapName}
                      </span>
                      <span
                        className={`font-semibold ${
                          m.won ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {m.won ? 'VICTORY' : 'DEFEAT'} ({m.scoreLine})
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
    </div>
  );
};
