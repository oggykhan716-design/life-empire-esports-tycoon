import { getCountryById } from '../data/countries';
import { ESPORTS_TITLES, getGameById } from '../data/esportsTitles';
import { FACILITY_TIERS } from '../data/facilitiesAndStaff';
import { INITIAL_RIVALS } from '../data/rivals';
import {
  ActiveTournament,
  CharacterProfile,
  EsportsPlayer,
  GameState,
  MatchReport,
  OrgStrategy,
  OrgType,
  PlayerAttributes,
  PlayerTier,
  RivalOrganization,
  TournamentTier,
} from '../types/game';
import { calculateOrgValuationUSD } from './economy';
import { simulateMatch } from './matchEngine';
import { computeOverall, generateInitialMarketPool, generatePlayer } from './playerGenerator';
import { SANDBOX_SLOT_ID } from './storage';
import {
  generateInitialTournaments,
  generateTournamentsForGame,
  pickOpponentForMatch,
  TOURNAMENT_TIER_CONFIGS,
} from './tournamentEngine';
import { advanceWeek, createNewGameState } from './weeklyEngine';

export type MoneyTargetAccount = 'personal_cash' | 'personal_bank' | 'org_bank';

export const ORG_TYPES: { id: OrgType; summary: string }[] = [
  { id: 'Standard', summary: 'Balanced traditional esports club framework.' },
  { id: 'Academy-Focused', summary: 'Prioritizes scouting, Paper Teams, and youth development.' },
  { id: 'Media & Content', summary: 'Content creators, podcasts, and broadcast monetization.' },
  { id: 'Global Franchise', summary: 'Multi-region operations with high sponsor appeal.' },
  { id: 'Championship Contender', summary: 'High-stakes roster depth targeting World Finals.' },
];

export const ORG_STRATEGIES: { id: OrgStrategy; summary: string }[] = [
  { id: 'Balanced', summary: 'Steady expansion across competitive and commercial arms.' },
  { id: 'Talent Development', summary: 'Sign high-potential prospects and develop chemistry.' },
  { id: 'Hyper-Aggressive', summary: 'Max spending on superstars and immediate titles.' },
  { id: 'Commercial Empire', summary: 'Maximize followers, sponsorships, and media valuation.' },
  { id: 'International Expansion', summary: 'Multi-title global circuits across every region.' },
];

const UNLIMITED_FUNDS_USD = 999_999_999;

function ensureOrgFounded(state: GameState): GameState {
  if (state.org.founded) return state;
  const country = getCountryById(state.character.countryId);
  const next: GameState = {
    ...state,
    registration: {
      ...state.registration,
      businessRegistered: true,
      licenseAcquired: true,
      legalDocsDone: true,
      brandingDone: true,
      marketingLaunchDone: true,
      initialReserveDeposited: true,
      approvalWeeksRemaining: 0,
    },
    org: {
      ...state.org,
      founded: true,
      name: state.registration.proposedName.trim() || `${state.character.lastName} Esports`,
      tag: state.registration.proposedTag.trim().toUpperCase() || 'ESP',
      color: state.registration.proposedColor || '#2563EB',
      icon: state.registration.proposedIcon || 'shield',
      headquarters: `${state.character.city}, ${country.name}`,
      foundedWeek: state.week,
      bankBalanceUSD: Math.max(state.org.bankBalanceUSD, 25000),
      facilityLevel: Math.max(1, state.org.facilityLevel),
      reputation: Math.max(10, state.org.reputation),
      followers: Math.max(1000, state.org.followers),
      orgType: state.org.orgType ?? 'Standard',
      orgStrategy: state.org.orgStrategy ?? 'Balanced',
      orgXp: state.org.orgXp ?? 100,
    },
  };
  next.org.valuationUSD = calculateOrgValuationUSD(next);
  return next;
}

function finalizeValuation(state: GameState): GameState {
  if (!state.org.founded) return state;
  return {
    ...state,
    org: {
      ...state.org,
      valuationUSD: calculateOrgValuationUSD(state),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* SANDBOX MODE GENERATOR                                                     */
/* -------------------------------------------------------------------------- */

export function createSandboxGameState(
  character: CharacterProfile,
  options?: {
    orgName?: string;
    orgTag?: string;
    orgType?: OrgType;
    orgStrategy?: OrgStrategy;
  }
): GameState {
  const base = createNewGameState(character, SANDBOX_SLOT_ID);
  const country = getCountryById(character.countryId);
  const orgName = options?.orgName?.trim() || `${character.lastName} Global`;
  const orgTag = options?.orgTag?.trim().toUpperCase() || character.lastName.slice(0, 3).toUpperCase() || 'SBX';

  const sandboxState: GameState = {
    ...base,
    saveSlotId: SANDBOX_SLOT_ID,
    isSandbox: true,
    day: 1,
    energy: 100,
    maxEnergy: 100,
    character: {
      ...base.character,
      education: 'MBA',
      reputation: 85,
      connections: 60,
      skills: {
        workEthic: 90,
        businessAcumen: 92,
        esportsKnowledge: 95,
        negotiation: 90,
        leadership: 92,
        marketing: 90,
      },
    },
    finances: {
      ...base.finances,
      cashUSD: 1_000_000,
      bankBalanceUSD: UNLIMITED_FUNDS_USD,
      debtUSD: 0,
      lifetimeEarnedUSD: UNLIMITED_FUNDS_USD,
    },
    registration: {
      ...base.registration,
      businessRegistered: true,
      licenseAcquired: true,
      legalDocsDone: true,
      brandingDone: true,
      marketingLaunchDone: true,
      initialReserveDeposited: true,
      approvalWeeksRemaining: 0,
      proposedName: orgName,
      proposedTag: orgTag,
    },
    org: {
      ...base.org,
      founded: true,
      name: orgName,
      tag: orgTag,
      color: '#3B82F6',
      icon: 'crown',
      headquarters: `${character.city}, ${country.name}`,
      foundedWeek: 1,
      bankBalanceUSD: UNLIMITED_FUNDS_USD,
      reputation: 85,
      followers: 250_000,
      facilityLevel: 9,
      equipmentUpgradeLevel: 10,
      facilityUnderConstruction: null,
      youtubeLaunched: true,
      podcastLaunched: true,
      merchBrandLaunched: true,
      orgType: options?.orgType ?? 'Global Franchise',
      orgStrategy: options?.orgStrategy ?? 'International Expansion',
      orgXp: 10000,
      paperTeamUnlocked: true,
      paperTeams: [],
      internationalExpansionUnlocked: true,
      bonusRosterSlots: 10,
      divisions: [
        {
          gameId: 'vanguard_protocol',
          chemistry: 85,
          tacticalPrep: 80,
          rankingPoints: 600,
          worldRank: 12,
          wins: 0,
          losses: 0,
          titlesWon: 0,
          trainedThisWeek: false,
        },
      ],
    },
    devOverrides: {
      unlockAllFeatures: true,
      unlockAllFacilities: true,
      unlockAllTournaments: true,
      instantUpgrades: true,
    },
    history: [
      {
        id: 'log_sandbox_start',
        week: 1,
        year: 1,
        category: 'Story',
        title: 'Sandbox Mode Initialized',
        summary: `Launched isolated Sandbox testing environment for ${orgName} [${orgTag}] with unlimited funds and all systems unlocked.`,
      },
    ],
  };

  // Mark all market players scouted in Sandbox for effortless testing
  sandboxState.marketPlayers = sandboxState.marketPlayers.map((p) => ({
    ...p,
    scouted: true,
  }));
  sandboxState.org.valuationUSD = calculateOrgValuationUSD(sandboxState);
  return sandboxState;
}

/* -------------------------------------------------------------------------- */
/* FINANCIAL CONTROLS                                                         */
/* -------------------------------------------------------------------------- */

export function devAdjustMoney(
  state: GameState,
  target: MoneyTargetAccount,
  deltaUSD: number
): GameState {
  if (target === 'personal_cash') {
    const nextCash = Math.max(0, state.finances.cashUSD + deltaUSD);
    return {
      ...state,
      finances: {
        ...state.finances,
        cashUSD: nextCash,
        lifetimeEarnedUSD:
          deltaUSD > 0 ? state.finances.lifetimeEarnedUSD + deltaUSD : state.finances.lifetimeEarnedUSD,
      },
    };
  }
  if (target === 'personal_bank') {
    const nextBank = Math.max(0, state.finances.bankBalanceUSD + deltaUSD);
    return {
      ...state,
      finances: {
        ...state.finances,
        bankBalanceUSD: nextBank,
        lifetimeEarnedUSD:
          deltaUSD > 0 ? state.finances.lifetimeEarnedUSD + deltaUSD : state.finances.lifetimeEarnedUSD,
      },
    };
  }
  const base = ensureOrgFounded(state);
  const nextOrgBank = Math.max(0, base.org.bankBalanceUSD + deltaUSD);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      bankBalanceUSD: nextOrgBank,
    },
  });
}

export function devSetBalance(
  state: GameState,
  target: MoneyTargetAccount,
  amountUSD: number
): GameState {
  const safeAmount = Math.max(0, Math.round(amountUSD));
  if (target === 'personal_cash') {
    return {
      ...state,
      finances: { ...state.finances, cashUSD: safeAmount },
    };
  }
  if (target === 'personal_bank') {
    return {
      ...state,
      finances: { ...state.finances, bankBalanceUSD: safeAmount },
    };
  }
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      bankBalanceUSD: safeAmount,
    },
  });
}

export function devSetMonthlyCashflow(
  state: GameState,
  monthlyRevenueUSD: number | null,
  monthlyExpensesUSD: number | null
): GameState {
  const base = state.org.founded ? state : ensureOrgFounded(state);
  const weeklyRev =
    monthlyRevenueUSD !== null ? Math.max(0, Math.round(monthlyRevenueUSD / 4)) : base.org.lastWeekRevenueUSD;
  const weeklyExp =
    monthlyExpensesUSD !== null ? Math.max(0, Math.round(monthlyExpensesUSD / 4)) : base.org.lastWeekExpensesUSD;

  return {
    ...base,
    org: {
      ...base.org,
      lastWeekRevenueUSD: weeklyRev,
      lastWeekExpensesUSD: weeklyExp,
    },
    devOverrides: {
      ...base.devOverrides,
      customMonthlyRevenueUSD: monthlyRevenueUSD,
      customMonthlyExpensesUSD: monthlyExpensesUSD,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* ORGANISATION CONTROLS                                                      */
/* -------------------------------------------------------------------------- */

export function devSetOrgReputation(state: GameState, reputation: number): GameState {
  const clamped = Math.max(0, Math.min(100, Math.round(reputation)));
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    character: {
      ...base.character,
      reputation: Math.max(base.character.reputation, clamped),
    },
    org: {
      ...base.org,
      reputation: clamped,
    },
  });
}

export function devMaximizeOrgXp(state: GameState): GameState {
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      orgXp: 10000,
      reputation: 100,
      followers: Math.max(base.org.followers, 300_000),
      equipmentUpgradeLevel: 10,
    },
  });
}

export function devUnlockAllOrgUpgrades(state: GameState): GameState {
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      equipmentUpgradeLevel: 10,
      youtubeLaunched: true,
      podcastLaunched: true,
      merchBrandLaunched: true,
      paperTeamUnlocked: true,
      internationalExpansionUnlocked: true,
      orgXp: Math.max(base.org.orgXp ?? 0, 5000),
    },
    devOverrides: {
      ...base.devOverrides,
      unlockAllFeatures: true,
      unlockAllFacilities: true,
      instantUpgrades: true,
    },
  });
}

export function devUnlockAllFacilities(state: GameState, setToMaxLevel = true): GameState {
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      facilityLevel: setToMaxLevel ? 9 : base.org.facilityLevel,
      facilityUnderConstruction: null,
    },
    devOverrides: {
      ...base.devOverrides,
      unlockAllFacilities: true,
    },
  });
}

export function devCompleteUpgrades(state: GameState): GameState {
  let next = { ...state };
  if (!next.org.founded) {
    next = ensureOrgFounded(next);
  }
  if (next.org.facilityUnderConstruction) {
    const targetLevel = next.org.facilityUnderConstruction.targetLevel;
    const fac = FACILITY_TIERS.find((f) => f.level === targetLevel);
    next = {
      ...next,
      org: {
        ...next.org,
        facilityLevel: Math.max(next.org.facilityLevel, targetLevel),
        facilityUnderConstruction: null,
        reputation: fac
          ? Math.min(100, next.org.reputation + Math.round(fac.reputationBonus * 0.35))
          : next.org.reputation,
      },
    };
  }
  next = {
    ...next,
    devOverrides: {
      ...next.devOverrides,
      instantUpgrades: true,
    },
  };
  return finalizeValuation(next);
}

export function devSetOrgTypeAndStrategy(
  state: GameState,
  orgType: OrgType,
  orgStrategy: OrgStrategy
): GameState {
  const base = ensureOrgFounded(state);
  return {
    ...base,
    org: {
      ...base.org,
      orgType,
      orgStrategy,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* TEAM CONTROLS                                                              */
/* -------------------------------------------------------------------------- */

export function devUnlockPaperTeam(state: GameState): GameState {
  const base = ensureOrgFounded(state);
  return {
    ...base,
    org: {
      ...base.org,
      paperTeamUnlocked: true,
    },
  };
}

export function devCreatePaperTeam(
  state: GameState,
  gameId: string,
  tier: PlayerTier = 'Professional'
): GameState {
  let next = ensureOrgFounded(state);
  const game = getGameById(gameId);

  // Open division automatically if not active
  if (!next.org.divisions.some((d) => d.gameId === gameId)) {
    next = {
      ...next,
      org: {
        ...next.org,
        divisions: [
          ...next.org.divisions,
          {
            gameId,
            chemistry: 82,
            tacticalPrep: 75,
            rankingPoints: 100,
            worldRank: 65,
            wins: 0,
            losses: 0,
            titlesWon: 0,
            trainedThisWeek: false,
          },
        ],
      },
    };
  }

  // Fill remaining starter slots with Paper Team athletes
  const existingStarters = next.roster.filter((p) => p.gameId === gameId && p.isStarter);
  const needed = Math.max(0, game.rosterSize - existingStarters.length);
  const newPlayers: EsportsPlayer[] = [];
  for (let i = 0; i < needed; i += 1) {
    const p = generatePlayer(gameId, tier, i);
    newPlayers.push({
      ...p,
      orgId: 'player_org',
      isStarter: true,
      isCaptain: existingStarters.length === 0 && i === 0,
      scouted: true,
      contractWeeksLeft: 36,
    });
  }

  const entryId = `paper_${Date.now()}`;
  const existingPaper = next.org.paperTeams ?? [];
  next = {
    ...next,
    roster: [...next.roster, ...newPlayers],
    org: {
      ...next.org,
      paperTeamUnlocked: true,
      paperTeams: [
        {
          id: entryId,
          name: `${next.org.tag || 'ORG'} Paper ${game.name.split(' ')[0]}`,
          gameId,
          createdWeek: next.week,
          active: true,
        },
        ...existingPaper,
      ],
    },
    history: [
      {
        id: `log_paper_${Date.now()}`,
        week: next.week,
        year: next.year,
        category: 'Esports' as const,
        title: `Created Paper Team (${game.name})`,
        summary: `Assembled an instant ${game.rosterSize}-player ${tier} Paper Team for ${game.name}.`,
      },
      ...next.history,
    ].slice(0, 80),
  };

  return finalizeValuation(next);
}

export function devUnlockInternationalExpansion(state: GameState): GameState {
  const base = ensureOrgFounded(state);
  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      internationalExpansionUnlocked: true,
      bonusRosterSlots: Math.max(base.org.bonusRosterSlots ?? 0, 11),
      reputation: Math.max(base.org.reputation, 65),
    },
  });
}

export function devAddRosterSlots(state: GameState, additionalSlots = 5): GameState {
  const base = ensureOrgFounded(state);
  return {
    ...base,
    org: {
      ...base.org,
      bonusRosterSlots: (base.org.bonusRosterSlots ?? 0) + additionalSlots,
    },
  };
}

export function devInstantRecruitPlayer(
  state: GameState,
  options: { marketPlayerId?: string; gameId?: string; tier?: PlayerTier }
): GameState {
  let next = ensureOrgFounded(state);
  let target: EsportsPlayer | undefined;

  if (options.marketPlayerId) {
    target = next.marketPlayers.find((p) => p.id === options.marketPlayerId);
  }
  if (!target) {
    const gId = options.gameId ?? next.org.divisions[0]?.gameId ?? 'vanguard_protocol';
    target = generatePlayer(gId, options.tier ?? 'Superstar', next.roster.length);
  }

  // Ensure division exists for this player's game
  if (!next.org.divisions.some((d) => d.gameId === target!.gameId)) {
    next = {
      ...next,
      org: {
        ...next.org,
        divisions: [
          ...next.org.divisions,
          {
            gameId: target.gameId,
            chemistry: 75,
            tacticalPrep: 65,
            rankingPoints: 0,
            worldRank: 110,
            wins: 0,
            losses: 0,
            titlesWon: 0,
            trainedThisWeek: false,
          },
        ],
      },
    };
  }

  const game = getGameById(target.gameId);
  const currentStarters = next.roster.filter(
    (p) => p.gameId === target!.gameId && p.isStarter
  ).length;

  const signed: EsportsPlayer = {
    ...target,
    orgId: 'player_org',
    scouted: true,
    contractWeeksLeft: 36,
    isStarter: currentStarters < game.rosterSize,
    isCaptain: next.roster.filter((p) => p.gameId === target!.gameId).length === 0,
  };

  next = {
    ...next,
    roster: [...next.roster, signed],
    marketPlayers: next.marketPlayers.filter((p) => p.id !== target!.id),
  };

  return finalizeValuation(next);
}

export function devUpdatePlayerAttributes(
  state: GameState,
  playerId: string,
  patch: Partial<PlayerAttributes> & { morale?: number; form?: number; overall?: number }
): GameState {
  const applyEdit = (p: EsportsPlayer): EsportsPlayer => {
    if (p.id !== playerId) return p;
    const { morale, form, overall, ...attrPatch } = patch;
    const updatedAttrs: PlayerAttributes = {
      ...p.attributes,
      ...attrPatch,
    };
    const nextOverall = overall !== undefined ? Math.max(1, Math.min(99, overall)) : computeOverall(updatedAttrs);
    return {
      ...p,
      attributes: updatedAttrs,
      overall: nextOverall,
      morale: morale !== undefined ? Math.max(0, Math.min(100, morale)) : p.morale,
      form: form !== undefined ? Math.max(0, Math.min(100, form)) : p.form,
      scouted: true,
    };
  };

  return finalizeValuation({
    ...state,
    roster: state.roster.map(applyEdit),
    marketPlayers: state.marketPlayers.map(applyEdit),
  });
}

export function devUpdatePlayerContract(
  state: GameState,
  playerId: string,
  patch: {
    monthlySalaryUSD?: number;
    contractWeeksLeft?: number;
    buyoutUSD?: number;
    isStarter?: boolean;
    isCaptain?: boolean;
  }
): GameState {
  const target = state.roster.find((p) => p.id === playerId) ?? state.marketPlayers.find((p) => p.id === playerId);
  if (!target) return state;

  const updateOne = (p: EsportsPlayer): EsportsPlayer => {
    if (patch.isCaptain && p.gameId === target.gameId) {
      return p.id === playerId ? { ...p, ...patch, isCaptain: true } : { ...p, isCaptain: false };
    }
    if (p.id !== playerId) return p;
    return { ...p, ...patch };
  };

  return finalizeValuation({
    ...state,
    roster: state.roster.map(updateOne),
    marketPlayers: state.marketPlayers.map(updateOne),
  });
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT CONTROLS                                                        */
/* -------------------------------------------------------------------------- */

export function devUnlockAllTournaments(state: GameState): GameState {
  let next = ensureOrgFounded(state);
  // Ensure every open division has tournaments across all 7 tiers
  const updatedTournaments = [...next.tournaments];
  next.org.divisions.forEach((div) => {
    const existingOpen = updatedTournaments.filter(
      (t) => t.gameId === div.gameId && t.status !== 'Completed'
    );
    if (existingOpen.length < 7) {
      const fresh = generateTournamentsForGame(div.gameId, next.week, next.rivals);
      const ids = new Set(updatedTournaments.map((t) => t.id));
      fresh.forEach((f) => {
        if (!ids.has(f.id)) updatedTournaments.push(f);
      });
    }
  });

  return {
    ...next,
    tournaments: updatedTournaments,
    devOverrides: {
      ...next.devOverrides,
      unlockAllTournaments: true,
    },
  };
}

export function devSimulateTournament(
  state: GameState,
  tournamentId: string,
  mode: 'next_round' | 'win_all' | 'lose_match'
): { nextState: GameState; lastReport: MatchReport | null } {
  let cur = ensureOrgFounded(state);
  let trn = cur.tournaments.find((t) => t.id === tournamentId);
  if (!trn) return { nextState: cur, lastReport: null };

  // Auto-open division and create paper starters if missing so simulation never crashes
  if (!cur.org.divisions.some((d) => d.gameId === trn!.gameId)) {
    cur = devCreatePaperTeam(cur, trn.gameId, 'Professional');
  }
  const game = getGameById(trn.gameId);
  const starters = cur.roster.filter((p) => p.gameId === trn!.gameId && p.isStarter);
  if (starters.length < game.rosterSize) {
    cur = devCreatePaperTeam(cur, trn.gameId, 'Professional');
  }

  // Force status to In Progress if Open
  if (trn.status === 'Open') {
    cur = {
      ...cur,
      tournaments: cur.tournaments.map((t) =>
        t.id === tournamentId ? { ...t, status: 'In Progress' } : t
      ),
    };
    trn = cur.tournaments.find((t) => t.id === tournamentId)!;
  }

  let lastReport: MatchReport | null = null;

  if (mode === 'next_round') {
    const opp = pickOpponentForMatch(trn, cur.rivals);
    const { report, updatedState } = simulateMatch(cur, trn, opp, 'balanced');
    cur = updatedState;
    lastReport = report;
  } else if (mode === 'lose_match') {
    const opp = { id: 'dev_opp', name: 'Apex Invitational Five', strength: 99 };
    const { report, updatedState } = simulateMatch(cur, trn, opp, 'aggressive');
    cur = updatedState;
    lastReport = report;
  } else {
    // Simulate until tournament completes (forcing win progression if testing full win bracket)
    let safety = 0;
    while (safety < 8) {
      safety += 1;
      const latest = cur.tournaments.find((t) => t.id === tournamentId);
      if (!latest || latest.status === 'Completed') break;
      const opp = {
        ...pickOpponentForMatch(latest, cur.rivals),
        strength: 25, // ensure reliable win simulation when testing full championship win
      };
      const { report, updatedState } = simulateMatch(cur, latest, opp, 'coach_decide');
      cur = updatedState;
      lastReport = report;
      if (!report.won) break;
    }
  }

  return { nextState: finalizeValuation(cur), lastReport };
}

export function devModifyRankings(
  state: GameState,
  gameId: string,
  rankingPoints: number,
  worldRank?: number
): GameState {
  const base = ensureOrgFounded(state);
  const safePts = Math.max(0, Math.round(rankingPoints));
  const computedRank = worldRank !== undefined ? Math.max(1, Math.round(worldRank)) : Math.max(1, Math.round(120 - safePts / 12));

  const hasDiv = base.org.divisions.some((d) => d.gameId === gameId);
  const divisions = hasDiv
    ? base.org.divisions.map((d) =>
        d.gameId === gameId ? { ...d, rankingPoints: safePts, worldRank: computedRank } : d
      )
    : [
        ...base.org.divisions,
        {
          gameId,
          chemistry: 75,
          tacticalPrep: 70,
          rankingPoints: safePts,
          worldRank: computedRank,
          wins: 0,
          losses: 0,
          titlesWon: 0,
          trainedThisWeek: false,
        },
      ];

  return finalizeValuation({
    ...base,
    org: {
      ...base.org,
      divisions,
    },
  });
}

export function devGenerateTestCompetition(
  state: GameState,
  gameId: string,
  tier: TournamentTier,
  customPrizePoolUSD?: number
): GameState {
  const game = getGameById(gameId);
  const cfg = TOURNAMENT_TIER_CONFIGS.find((c) => c.tier === tier) ?? TOURNAMENT_TIER_CONFIGS[0];
  const prizePoolUSD = customPrizePoolUSD ?? Math.round(cfg.basePrizeUSD * game.basePrizeScale);
  const newTrn: ActiveTournament = {
    id: `trn_dev_${gameId}_${Date.now()}`,
    name: `${game.name}: Test ${tier}`,
    gameId,
    tier,
    prizePoolUSD,
    entryFeeUSD: 0,
    minRankPoints: 0,
    round: 1,
    maxRounds: cfg.maxRounds,
    status: 'Open',
    participants: state.rivals.slice(0, 6).map((r) => r.id),
    playerEliminated: false,
    currentOpponentId: null,
    winnerName: null,
  };

  return {
    ...state,
    tournaments: [newTrn, ...state.tournaments],
  };
}

/* -------------------------------------------------------------------------- */
/* TIME CONTROLS                                                              */
/* -------------------------------------------------------------------------- */

export function devSkipDays(state: GameState, days = 1): GameState {
  const curDay = state.day ?? 1;
  const totalDays = curDay - 1 + days;
  const weeksToAdvance = Math.floor(totalDays / 7);
  const nextDay = (totalDays % 7) + 1;

  let cur = { ...state };
  if (weeksToAdvance > 0) {
    cur = devSkipWeeks(cur, weeksToAdvance);
  }
  return {
    ...cur,
    day: nextDay,
    energy: Math.min(cur.maxEnergy, cur.energy + 15 * days),
  };
}

export function devSkipWeeks(state: GameState, weeks: number): GameState {
  let cur = { ...state };
  for (let i = 0; i < weeks; i += 1) {
    // Clear pending story events mid-fast-forward so simulation doesn't stall
    if (i < weeks - 1 && cur.pendingEvent) {
      cur = { ...cur, pendingEvent: null };
    }
    cur = advanceWeek(cur);
  }
  return {
    ...cur,
    day: 1,
  };
}

/* -------------------------------------------------------------------------- */
/* GENERAL CONTROLS                                                           */
/* -------------------------------------------------------------------------- */

export function devUnlockAllGameFeatures(state: GameState): GameState {
  let next = devUnlockAllOrgUpgrades(state);
  next = devUnlockAllFacilities(next, true);
  next = devUnlockAllTournaments(next);
  next = devUnlockInternationalExpansion(next);
  next = {
    ...next,
    marketPlayers: next.marketPlayers.map((p) => ({ ...p, scouted: true })),
    devOverrides: {
      ...next.devOverrides,
      unlockAllFeatures: true,
      unlockAllFacilities: true,
      unlockAllTournaments: true,
      instantUpgrades: true,
    },
  };
  return finalizeValuation(next);
}

const TEST_ORG_TEMPLATES = [
  { name: 'Zenith Syndicate', tag: 'ZEN', color: '#0EA5E9', region: 'Europe' },
  { name: 'Kurogane Five', tag: 'KRG', color: '#EF4444', region: 'East Asia' },
  { name: 'Solaris Collective', tag: 'SOL', color: '#F59E0B', region: 'North America' },
  { name: 'Tempest Republic', tag: 'TMP', color: '#8B5CF6', region: 'South America' },
  { name: 'Mirage Vanguard', tag: 'MRG', color: '#10B981', region: 'Southeast Asia' },
];

export function devGenerateTestOrganisations(state: GameState, count = 3): GameState {
  const created: RivalOrganization[] = [];
  for (let i = 0; i < count; i += 1) {
    const tpl = TEST_ORG_TEMPLATES[(state.rivals.length + i) % TEST_ORG_TEMPLATES.length];
    const str = 72 + Math.floor(Math.random() * 22);
    const val = 450_000 + Math.floor(Math.random() * 3_500_000);
    created.push({
      id: `rival_dev_${Date.now()}_${i}`,
      name: `${tpl.name} ${Math.floor(10 + Math.random() * 89)}`,
      tag: tpl.tag,
      color: tpl.color,
      identity: 'Developer-generated competitive esports organization.',
      region: tpl.region,
      valuationUSD: val,
      bankBalanceUSD: Math.round(val * 0.4),
      reputation: Math.min(98, str + 4),
      fanbase: 40_000 + Math.floor(Math.random() * 250_000),
      strength: str,
      activeGameIds: ESPORTS_TITLES.slice(0, 4).map((g) => g.id),
      trophies: Math.floor(Math.random() * 6),
      status: 'Active',
      recentTrend: 'Rising',
    });
  }
  return {
    ...state,
    rivals: [...created, ...state.rivals],
  };
}

export function devGenerateTestPlayers(
  state: GameState,
  gameId: string,
  tier: PlayerTier,
  count = 5
): GameState {
  const generated: EsportsPlayer[] = [];
  for (let i = 0; i < count; i += 1) {
    const p = generatePlayer(gameId, tier, i);
    generated.push({ ...p, scouted: true });
  }
  return {
    ...state,
    marketPlayers: [...generated, ...state.marketPlayers],
  };
}

export type ResettableSystem = 'finances' | 'org' | 'roster' | 'tournaments' | 'rivals';

export function devResetSystem(state: GameState, system: ResettableSystem): GameState {
  const country = getCountryById(state.character.countryId);

  if (system === 'finances') {
    return {
      ...state,
      finances: {
        cashUSD: 100,
        bankBalanceUSD: 0,
        debtUSD: 0,
        lifestyle: 'basic',
        ownedAssetIds: [],
        investments: [],
        lastWeekIncomeUSD: 0,
        lastWeekExpensesUSD: 0,
        lifetimeEarnedUSD: 100,
      },
    };
  }

  if (system === 'org') {
    return {
      ...state,
      roster: [],
      registration: {
        businessRegistered: false,
        licenseAcquired: false,
        legalDocsDone: false,
        brandingDone: false,
        marketingLaunchDone: false,
        initialReserveDeposited: false,
        approvalWeeksRemaining: 0,
        proposedName: `${state.character.lastName} Esports`,
        proposedTag: state.character.lastName.slice(0, 3).toUpperCase() || 'ESP',
        proposedColor: '#2563EB',
        proposedIcon: 'shield',
      },
      org: {
        founded: false,
        name: '',
        tag: '',
        color: '#2563EB',
        icon: 'shield',
        headquarters: `${state.character.city}, ${country.name}`,
        foundedWeek: 0,
        bankBalanceUSD: 0,
        valuationUSD: 0,
        reputation: 0,
        followers: 0,
        facilityLevel: 0,
        equipmentUpgradeLevel: 0,
        facilityUnderConstruction: null,
        divisions: [],
        staff: [],
        sponsors: [],
        creators: [],
        youtubeLaunched: false,
        merchBrandLaunched: false,
        podcastLaunched: false,
        lastWeekRevenueUSD: 0,
        lastWeekExpensesUSD: 0,
        trophies: [],
        paperTeamUnlocked: false,
        paperTeams: [],
        internationalExpansionUnlocked: false,
        bonusRosterSlots: 0,
        orgXp: 0,
      },
    };
  }

  if (system === 'roster') {
    return finalizeValuation({
      ...state,
      roster: [],
      org: {
        ...state.org,
        paperTeams: [],
      },
      marketPlayers: generateInitialMarketPool(),
    });
  }

  if (system === 'tournaments') {
    return {
      ...state,
      tournaments: generateInitialTournaments(state.rivals),
      recentMatches: [],
    };
  }

  // rivals
  const freshRivals = INITIAL_RIVALS.map((r) => ({ ...r }));
  return {
    ...state,
    rivals: freshRivals,
    worldNews: [
      {
        id: `news_reset_${Date.now()}`,
        week: state.week,
        headline: 'Global Esports League Re-seeded',
        body: 'International organizations and ranking standings have been reset to opening season baselines.',
      },
    ],
  };
}
