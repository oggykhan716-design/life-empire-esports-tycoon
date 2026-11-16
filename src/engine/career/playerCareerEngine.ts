import { getCountryById } from '../../data/countries';
import { getGameById } from '../../data/esportsTitles';
import { FICTIONAL_STARTING_TALENTS } from '../../data/fictionalPlayers';
import { INITIAL_RIVALS } from '../../data/rivals';
import {
  PlayerCareerAttributes,
  PlayerCareerRank,
  PlayerCareerState,
  PlayerStartingBackground,
} from '../../types/career';
import { CharacterProfile, GameState } from '../../types/game';
import { appendBankTransaction } from '../economy/bankEngine';
import { createInitialPhoneState, createWorldEvent, ensurePhoneState } from '../events/eventBus';
import { processWorldEvents } from '../events/eventProcessor';
import { generateInitialMarketPool } from '../playerGenerator';
import { generateInitialTournaments } from '../tournamentEngine';
import { generateContractOffersForPlayer } from './contractEngine';
import { generateTryoutInvitesForPlayer } from './tryoutEngine';

export interface PlayerCareerSetup {
  ign: string;
  nationality: string;
  primaryGameId: string;
  preferredRole: string;
  startingBackground: PlayerStartingBackground;
}

export function evaluatePlayerCareerRank(pc: PlayerCareerState): PlayerCareerRank {
  const { skill, reputation, experience } = pc.attributes;
  if (pc.trophiesWon >= 4 && skill >= 88 && reputation >= 82) return 'Legend';
  if ((pc.trophiesWon >= 2 || pc.mvpCount >= 5) && skill >= 82 && reputation >= 68) return 'Superstar';
  if (pc.matchesPlayed >= 14 && skill >= 72 && reputation >= 48) return 'Established Professional';
  if ((pc.currentOrgId && skill >= 62) || pc.matchesPlayed >= 8) return 'Professional';
  if (pc.matchesPlayed >= 3 || skill >= 54 || reputation >= 18) return 'Semi-Pro';
  if (experience >= 15 && skill >= 50) return 'Semi-Pro';
  return 'Amateur';
}

export function createNewPlayerCareerState(
  character: CharacterProfile,
  setup: PlayerCareerSetup,
  saveSlotId = 'slot_1'
): GameState {
  const rivals = INITIAL_RIVALS.map((r) => ({ ...r }));
  const baseMarket = generateInitialMarketPool();
  // Seed Kiwyos YT, Sparky, and Adi Gamer as independent ecosystem figures
  const existingIds = new Set(baseMarket.map((p) => p.id));
  const marketPlayers = [
    ...FICTIONAL_STARTING_TALENTS.filter((p) => !existingIds.has(p.id)),
    ...baseMarket,
  ];
  const tournaments = generateInitialTournaments(rivals);
  const country = getCountryById(character.countryId);

  const bgBonus: Record<PlayerStartingBackground, Partial<PlayerCareerAttributes>> = {
    'Ranked Prodigy': { skill: 52, popularity: 14, consistency: 42, pressure: 40 },
    'LAN Grinder': { skill: 48, experience: 24, pressure: 54, consistency: 48 },
    'College Captain': { skill: 45, teamwork: 62, reputation: 16, consistency: 50 },
    'Academy Hopeful': { skill: 47, potential: 86, teamwork: 52, experience: 18 },
  };
  const bonus = bgBonus[setup.startingBackground];

  const playerCareer: PlayerCareerState = {
    ign: setup.ign.trim() || `${character.firstName}GG`,
    nationality: setup.nationality.trim() || country.name,
    primaryGameId: setup.primaryGameId,
    preferredRole: setup.preferredRole,
    startingBackground: setup.startingBackground,
    rank: 'Amateur',
    attributes: {
      skill: bonus.skill ?? 48,
      consistency: bonus.consistency ?? 45,
      experience: bonus.experience ?? 12,
      reputation: bonus.reputation ?? 8,
      popularity: bonus.popularity ?? 6,
      potential: bonus.potential ?? 84,
      teamwork: bonus.teamwork ?? 48,
      pressure: bonus.pressure ?? 42,
    },
    currentOrgId: null,
    currentOrgName: null,
    currentOrgTag: null,
    isStarter: false,
    isCaptain: false,
    monthlySalaryUSD: 0,
    contractWeeksLeft: 0,
    winBonusUSD: 0,
    tournamentBonusPct: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    mvpCount: 0,
    trophiesWon: 0,
    avgRating: 1.0,
    trainedThisWeek: false,
    scrimmedThisWeek: false,
    tryouts: [],
    contractOffers: [],
    retired: false,
    transferRequested: false,
    personalSponsors: [],
  };

  const game = getGameById(setup.primaryGameId);

  const rawState: GameState = {
    version: '2.0.0',
    schemaVersion: 2,
    saveSlotId,
    careerType: 'PLAYER',
    randomSeed: Math.floor(100000 + Math.random() * 899999),
    week: 1,
    year: 1,
    day: 1,
    energy: 100,
    maxEnergy: 100,
    character,
    employment: {
      currentJobId: null,
      level: 1,
      weeksInRole: 0,
      consistencyStreak: 0,
      shiftsWorkedThisWeek: 0,
    },
    finances: {
      cashUSD: 150,
      bankBalanceUSD: 250,
      debtUSD: 0,
      lifestyle: 'basic',
      ownedAssetIds: [],
      investments: [],
      lastWeekIncomeUSD: 0,
      lastWeekExpensesUSD: 0,
      lifetimeEarnedUSD: 400,
    },
    registration: {
      businessRegistered: false,
      licenseAcquired: false,
      legalDocsDone: false,
      brandingDone: false,
      marketingLaunchDone: false,
      initialReserveDeposited: false,
      approvalWeeksRemaining: 0,
      proposedName: `${playerCareer.ign} Esports`,
      proposedTag: playerCareer.ign.slice(0, 3).toUpperCase() || 'PRO',
      proposedColor: '#2563EB',
      proposedIcon: 'shield',
    },
    org: {
      founded: false,
      name: '',
      tag: '',
      color: '#2563EB',
      icon: 'shield',
      headquarters: `${character.city}, ${country.name}`,
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
    },
    playerCareer,
    roster: [],
    marketPlayers,
    rivals,
    tournaments,
    recentMatches: [],
    pendingEvent: null,
    lastWeeklyRecap: null,
    history: [
      {
        id: 'log_player_start',
        week: 1,
        year: 1,
        category: 'Career',
        title: `${playerCareer.ign} Enters the ${game.name} Scene`,
        summary: `Started your pro player journey in ${character.city}, ${country.name} as a ${setup.startingBackground} (${setup.preferredRole}).`,
      },
    ],
    worldNews: [
      {
        id: 'news_init_player_1',
        week: 1,
        headline: 'Scouts Eye Amateur Prodigies Ahead of Open Qualifiers',
        body: `Independent talents like Kiwyos YT, Sparky, and Adi Gamer headline emerging ranked prospects across ${game.name} and global circuits.`,
      },
    ],
    unlockedAchievements: [],
    ending: null,
    activitiesThisWeek: [],
    eventHistory: [],
    processedEventIds: [],
  };

  rawState.phoneState = createInitialPhoneState(rawState);
  return generateTryoutInvitesForPlayer(rawState);
}

export function trainPlayerCareerAttribute(
  state: GameState,
  focus: 'skill' | 'consistency' | 'teamwork' | 'pressure'
): { nextState: GameState; message: string } {
  const pc = state.playerCareer;
  if (!pc || state.energy < 20) {
    return { nextState: state, message: 'Not enough energy (20 required).' };
  }

  const currentVal = pc.attributes[focus];
  const cap = focus === 'skill' ? Math.max(pc.attributes.potential, 85) : 99;
  const gain = currentVal < cap ? 2 : 1;

  const updatedPc: PlayerCareerState = {
    ...pc,
    trainedThisWeek: true,
    attributes: {
      ...pc.attributes,
      [focus]: Math.min(99, currentVal + gain),
      experience: Math.min(99, pc.attributes.experience + 1),
    },
  };
  updatedPc.rank = evaluatePlayerCareerRank(updatedPc);

  return {
    nextState: {
      ...state,
      energy: state.energy - 20,
      playerCareer: updatedPc,
    },
    message: `Focused training complete (+${gain} ${focus}, +1 Experience).`,
  };
}

export function playPlayerCareerMatch(
  state: GameState,
  mode: 'ranked_open' | 'pro_match'
): { nextState: GameState; summary: string } {
  const pc = state.playerCareer;
  if (!pc) return { nextState: state, summary: 'Player career inactive.' };
  const energyCost = mode === 'ranked_open' ? 20 : 25;
  if (state.energy < energyCost) {
    return { nextState: state, summary: `Need ${energyCost} energy to compete.` };
  }

  const game = getGameById(pc.primaryGameId);
  const org = pc.currentOrgId
    ? state.rivals.find((r) => r.id === pc.currentOrgId)
    : undefined;

  const teamStrength = org ? org.strength : pc.attributes.skill + 8;
  const rivalPool = state.rivals.filter((r) => r.id !== pc.currentOrgId && r.status === 'Active');
  const opp =
    mode === 'ranked_open' || rivalPool.length === 0
      ? { id: 'open_bracket', name: 'Challenger Five', strength: Math.max(46, pc.attributes.skill - 2) }
      : rivalPool[Math.floor(Math.random() * rivalPool.length)];

  const winProb = Math.max(
    18,
    Math.min(88, Math.round(50 + (teamStrength - opp.strength) * 1.8 + (pc.attributes.skill - 60) * 0.25))
  );
  const won = Math.random() * 100 < winProb;
  const scoreLine = won ? '2 – 1' : '1 – 2';

  const perfFactor = (pc.attributes.skill * 0.65 + pc.attributes.consistency * 0.2 + pc.attributes.pressure * 0.15) / 100;
  const rating = Number((won ? 0.98 + perfFactor * 0.48 : 0.72 + perfFactor * 0.36).toFixed(2));
  const isMvp = won && rating >= 1.24;

  const prizeShare = won
    ? mode === 'pro_match'
      ? Math.max(250, pc.winBonusUSD + Math.round((org?.reputation ?? 60) * 18))
      : 180
    : mode === 'pro_match'
    ? 60
    : 0;

  const newMatchesPlayed = pc.matchesPlayed + 1;
  const newAvgRating = Number(
    ((pc.avgRating * pc.matchesPlayed + rating) / newMatchesPlayed).toFixed(2)
  );
  const gainedTrophy = won && mode === 'pro_match' && Math.random() < 0.28;

  const updatedPc: PlayerCareerState = {
    ...pc,
    matchesPlayed: newMatchesPlayed,
    matchesWon: pc.matchesWon + (won ? 1 : 0),
    mvpCount: pc.mvpCount + (isMvp ? 1 : 0),
    trophiesWon: pc.trophiesWon + (gainedTrophy ? 1 : 0),
    avgRating: newAvgRating,
    attributes: {
      ...pc.attributes,
      skill: Math.min(99, pc.attributes.skill + (won && Math.random() < 0.6 ? 1 : 0)),
      experience: Math.min(99, pc.attributes.experience + 2),
      reputation: Math.min(100, Math.max(0, pc.attributes.reputation + (won ? (isMvp ? 4 : 2) : -1))),
      popularity: Math.min(100, pc.attributes.popularity + (isMvp ? 4 : won ? 2 : 0)),
    },
  };
  updatedPc.rank = evaluatePlayerCareerRank(updatedPc);

  const teamName = org?.name ?? `${pc.ign} Mix`;
  const tournamentName =
    mode === 'pro_match' ? `${game.name} Pro Split` : `${game.name} Open Qualifier`;

  let nextState: GameState = {
    ...state,
    energy: state.energy - energyCost,
    finances: {
      ...state.finances,
      bankBalanceUSD: state.finances.bankBalanceUSD + prizeShare,
      lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + prizeShare,
    },
    playerCareer: updatedPc,
    history: [
      {
        id: `log_pcm_${Date.now()}`,
        week: state.week,
        year: state.year,
        category: 'Esports' as const,
        title: `${won ? 'Victory' : 'Loss'} vs ${opp.name} (${scoreLine})`,
        summary: `Posted ${rating} rating${isMvp ? ' (MVP)' : ''} in ${tournamentName}.${prizeShare > 0 ? ` Earned $${prizeShare.toLocaleString()}.` : ''}`,
      },
      ...state.history,
    ].slice(0, 80),
  };

  nextState = ensurePhoneState(nextState);
  const eventsToFire = [
    createWorldEvent(nextState, {
      type: gainedTrophy ? 'TOURNAMENT_COMPLETED' : 'MATCH_COMPLETED',
      actorId: org?.id ?? 'user_player',
      targetId: opp.id,
      title: gainedTrophy
        ? `${teamName} Win ${tournamentName}!`
        : `${teamName} ${won ? 'Defeat' : 'Fall to'} ${opp.name}`,
      description: `${pc.ign} posted a ${rating} rating (${scoreLine}) in ${game.name}.`,
      importance: gainedTrophy || isMvp ? 'HIGH' : 'MEDIUM',
      payload: {
        teamName,
        opponentName: opp.name,
        scoreLine,
        won,
        mvpIgn: isMvp ? pc.ign : teamName,
        playerIgn: pc.ign,
        tournamentName,
        gameName: game.name,
        winnerOrgId: won ? org?.id ?? 'user_player' : opp.id,
        notifyUser: true,
      },
    }),
  ];

  if (prizeShare > 0) {
    eventsToFire.push(
      createWorldEvent(nextState, {
        type: 'TOURNAMENT_PRIZE_RECEIVED',
        actorId: 'user_player',
        title: 'Match Winnings Deposited',
        description: `Prize & win bonus from ${tournamentName} (+$${prizeShare.toLocaleString()})`,
        importance: 'LOW',
        payload: {
          accountId: 'personal_bank',
          amountUSD: prizeShare,
        },
      })
    );
  }

  nextState = processWorldEvents(nextState, eventsToFire);
  return {
    nextState,
    summary: `${won ? 'Won' : 'Lost'} ${scoreLine} vs ${opp.name} (Rating ${rating}${isMvp ? ' · MVP!' : ''}).`,
  };
}

export function tickPlayerCareerWeekly(state: GameState): {
  nextState: GameState;
  weeklySalaryIncome: number;
  highlights: string[];
} {
  let cur = state;
  const pc = cur.playerCareer;
  if (!pc || pc.retired) {
    return { nextState: cur, weeklySalaryIncome: 0, highlights: [] };
  }

  const highlights: string[] = [];
  let weeklySalaryIncome = 0;
  let updatedPc: PlayerCareerState = {
    ...pc,
    trainedThisWeek: false,
    scrimmedThisWeek: false,
  };

  // Weekly org salary (monthly / 4)
  if (updatedPc.currentOrgId && updatedPc.monthlySalaryUSD > 0) {
    const weeklyPay = Math.round(updatedPc.monthlySalaryUSD / 4);
    weeklySalaryIncome += weeklyPay;
    updatedPc.contractWeeksLeft = Math.max(0, updatedPc.contractWeeksLeft - 1);
    highlights.push(
      `Received pro salary from ${updatedPc.currentOrgName}: +$${weeklyPay.toLocaleString()}`
    );

    if (cur.phoneState) {
      cur = {
        ...cur,
        phoneState: {
          ...cur.phoneState,
          transactions: appendBankTransaction(cur.phoneState.transactions, {
            accountId: 'personal_bank',
            type: 'INCOME',
            category: 'Pro Salary',
            amount: weeklyPay,
            description: `Weekly salary from ${updatedPc.currentOrgName}`,
            timestamp: Date.now(),
            gameWeek: cur.week,
          }),
        },
      };
    }

    if (updatedPc.contractWeeksLeft === 0) {
      highlights.push(`Your contract with ${updatedPc.currentOrgName} expired—entered free agency.`);
      updatedPc.currentOrgId = null;
      updatedPc.currentOrgName = null;
      updatedPc.currentOrgTag = null;
      updatedPc.monthlySalaryUSD = 0;
    }
  }

  // Personal sponsor weekly payouts
  if (updatedPc.personalSponsors.length > 0) {
    const nextSponsors = updatedPc.personalSponsors
      .map((sp) => {
        weeklySalaryIncome += sp.weeklyPayoutUSD;
        return { ...sp, weeksRemaining: sp.weeksRemaining - 1 };
      })
      .filter((sp) => sp.weeksRemaining > 0);
    updatedPc.personalSponsors = nextSponsors;
  }

  updatedPc.rank = evaluatePlayerCareerRank(updatedPc);

  cur = {
    ...cur,
    finances: {
      ...cur.finances,
      bankBalanceUSD: cur.finances.bankBalanceUSD + weeklySalaryIncome,
      lifetimeEarnedUSD: cur.finances.lifetimeEarnedUSD + weeklySalaryIncome,
    },
    playerCareer: updatedPc,
  };

  // Trigger periodic tryouts or contract offers
  cur = generateTryoutInvitesForPlayer(cur);
  cur = generateContractOffersForPlayer(cur);

  return { nextState: cur, weeklySalaryIncome, highlights };
}

export function retirePlayerIntoOrgOwner(
  state: GameState,
  orgName: string,
  orgTag: string
): { nextState: GameState; message: string } {
  const pc = state.playerCareer;
  if (!pc) return { nextState: state, message: 'No player career found.' };

  const country = getCountryById(state.character.countryId);
  const cleanName = orgName.trim() || `${pc.ign} Esports`;
  const cleanTag = orgTag.trim().toUpperCase().slice(0, 4) || pc.ign.slice(0, 3).toUpperCase() || 'PRO';

  const seededOrgFunds = Math.max(15000, Math.round(state.finances.bankBalanceUSD * 0.4));
  const remainingBank = Math.max(0, state.finances.bankBalanceUSD - seededOrgFunds);

  let nextState: GameState = {
    ...state,
    careerType: 'OWNER',
    finances: {
      ...state.finances,
      bankBalanceUSD: remainingBank,
    },
    character: {
      ...state.character,
      reputation: Math.min(100, Math.max(state.character.reputation, pc.attributes.reputation)),
      connections: state.character.connections + 25,
    },
    registration: {
      ...state.registration,
      businessRegistered: true,
      licenseAcquired: true,
      legalDocsDone: true,
      brandingDone: true,
      marketingLaunchDone: true,
      initialReserveDeposited: true,
      approvalWeeksRemaining: 0,
      proposedName: cleanName,
      proposedTag: cleanTag,
    },
    org: {
      ...state.org,
      founded: true,
      name: cleanName,
      tag: cleanTag,
      headquarters: `${state.character.city}, ${country.name}`,
      foundedWeek: state.week,
      bankBalanceUSD: seededOrgFunds,
      reputation: Math.max(25, Math.round(pc.attributes.reputation * 0.85)),
      followers: Math.max(2500, pc.attributes.popularity * 850),
      facilityLevel: 1,
      valuationUSD: seededOrgFunds + 45000,
    },
    playerCareer: {
      ...pc,
      retired: true,
      retiredWeek: state.week,
      currentOrgId: null,
      currentOrgName: null,
      monthlySalaryUSD: 0,
    },
    history: [
      {
        id: `log_retire_${Date.now()}`,
        week: state.week,
        year: state.year,
        category: 'Career' as const,
        title: `${pc.ign} Retires to Found ${cleanName}`,
        summary: `Transitioned from active competition into esports ownership with ${cleanName} [${cleanTag}].`,
      },
      ...state.history,
    ].slice(0, 80),
  };

  nextState = ensurePhoneState(nextState);
  const evt = createWorldEvent(nextState, {
    type: 'ORGANISATION_CREATED',
    actorId: 'player_org',
    title: `${pc.ign} Retires & Launches ${cleanName}`,
    description: `Legendary competitor ${pc.ign} officially established ${cleanName} [${cleanTag}].`,
    importance: 'HIGH',
    payload: {
      orgName: cleanName,
      teamName: cleanName,
      playerIgn: pc.ign,
      notifyUser: true,
    },
  });
  nextState = processWorldEvents(nextState, [evt]);

  return {
    nextState,
    message: `Retired from playing and launched ${cleanName} [${cleanTag}]!`,
  };
}
