import { getCountryById } from '../data/countries';
import { ACHIEVEMENTS, STORY_EVENT_TEMPLATES } from '../data/eventsAndAchievements';
import { FACILITY_TIERS, STAFF_ROLES } from '../data/facilitiesAndStaff';
import { JOB_LEVEL_MULTIPLIER, JOBS } from '../data/jobs';
import { INITIAL_RIVALS } from '../data/rivals';
import {
  ActiveStoryEvent,
  CharacterProfile,
  GameState,
  RivalOrganization,
  SponsorDeal,
} from '../types/game';
import {
  calculateOrgValuationUSD,
  calculatePersonalNetWorthUSD,
  calculateWeeklyPersonalExpensesUSD,
} from './economy';
import { generateInitialMarketPool, generatePlayer } from './playerGenerator';
import { generateInitialTournaments, generateTournamentsForGame } from './tournamentEngine';

export function createNewGameState(
  character: CharacterProfile,
  saveSlotId = 'slot_1'
): GameState {
  const rivals = INITIAL_RIVALS.map((r) => ({ ...r }));
  const marketPlayers = generateInitialMarketPool();
  const tournaments = generateInitialTournaments(rivals);

  const country = getCountryById(character.countryId);

  return {
    version: '1.0.0',
    saveSlotId,
    week: 1,
    year: 1,
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
    registration: {
      businessRegistered: false,
      licenseAcquired: false,
      legalDocsDone: false,
      brandingDone: false,
      marketingLaunchDone: false,
      initialReserveDeposited: false,
      approvalWeeksRemaining: 0,
      proposedName: `${character.lastName} Esports`,
      proposedTag: character.lastName.slice(0, 3).toUpperCase() || 'ESP',
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
    roster: [],
    marketPlayers,
    rivals,
    tournaments,
    recentMatches: [],
    pendingEvent: null,
    lastWeeklyRecap: null,
    history: [
      {
        id: 'log_start',
        week: 1,
        year: 1,
        category: 'Life',
        title: 'A Fresh Start',
        summary: `Turned 18 in ${character.city}, ${country.name} with $100 in your pocket and an ambition to build an esports empire.`,
      },
    ],
    worldNews: [
      {
        id: 'news_init_1',
        week: 1,
        headline: 'Titan Esports Opens Season Ranked #1 Globally',
        body: 'Defending multi-title powerhouse Titan Esports enters the new competitive year atop global org rankings.',
      },
      {
        id: 'news_init_2',
        week: 1,
        headline: 'Vanguard Protocol & Legends of Dominion Announce Record Circuits',
        body: 'Regional leagues and international qualifiers are open for licensed organizations worldwide.',
      },
    ],
    unlockedAchievements: [],
    ending: null,
    activitiesThisWeek: [],
  };
}

export function getEnergyCosts(state: GameState) {
  const hasGM = state.org.staff.some((s) => s.roleId === 'general_manager');
  const hasScout = state.org.staff.some((s) => s.roleId === 'scout');
  const hasCoach = state.org.staff.some((s) => s.roleId === 'head_coach');
  const hasTeamMgr = state.org.staff.some((s) => s.roleId === 'team_manager');

  return {
    research: 10,
    networking: 15,
    scouting: hasScout ? 9 : 15,
    training: hasCoach ? 14 : 20,
    contractNegotiation: 10,
    orgManagement: hasGM ? 7 : 15,
    tournamentPrep: hasTeamMgr ? 14 : 20,
  };
}

export function calculateShiftIncomeUSD(state: GameState): number {
  if (!state.employment.currentJobId) return 0;
  const job = JOBS.find((j) => j.id === state.employment.currentJobId);
  if (!job) return 0;
  const country = getCountryById(state.character.countryId);
  const levelMult = JOB_LEVEL_MULTIPLIER[state.employment.level];
  const skillBoost = 1 + state.character.skills.workEthic * 0.0025;
  const gross = job.baseWeeklyIncomeUSD * country.wageMultiplier * levelMult * skillBoost;
  const net = gross * (1 - country.taxRate * 0.6);
  return Math.round(net);
}

export function generateAvailableSponsors(state: GameState): SponsorDeal[] {
  if (!state.org.founded) return [];
  const country = getCountryById(state.character.countryId);
  const hasMarketing = state.org.staff.some((s) => s.roleId === 'marketing_director');
  const bonusMult = (country.id === 'usa' ? 1.15 : 1.0) * (hasMarketing ? 1.2 : 1.0);
  const rep = state.org.reputation;

  const catalog: Omit<SponsorDeal, 'id'>[] = [
    {
      brandName: 'VoltPulse Energy',
      industry: 'Beverages',
      type: 'Short-term',
      weeklyPayoutUSD: Math.round(450 * bonusMult),
      signingBonusUSD: Math.round(1200 * bonusMult),
      weeksRemaining: 8,
      minReputation: 0,
      winBonusUSD: 150,
      penaltyUSD: 1000,
    },
    {
      brandName: 'Kinetix Peripherals',
      industry: 'Gaming Hardware',
      type: 'Short-term',
      weeklyPayoutUSD: Math.round(850 * bonusMult),
      signingBonusUSD: Math.round(2500 * bonusMult),
      weeksRemaining: 12,
      minReputation: 12,
      winBonusUSD: 300,
      penaltyUSD: 2200,
    },
    {
      brandName: 'Hyperion Fiber',
      industry: 'Telecom',
      type: 'Annual',
      weeklyPayoutUSD: Math.round(1650 * bonusMult),
      signingBonusUSD: Math.round(6000 * bonusMult),
      weeksRemaining: 26,
      minReputation: 28,
      winBonusUSD: 500,
      penaltyUSD: 5000,
    },
    {
      brandName: 'Stratos Chairs',
      industry: 'Ergonomics',
      type: 'Annual',
      weeklyPayoutUSD: Math.round(2600 * bonusMult),
      signingBonusUSD: Math.round(10000 * bonusMult),
      weeksRemaining: 36,
      minReputation: 45,
      winBonusUSD: 900,
      penaltyUSD: 8000,
    },
    {
      brandName: 'Aether Cloud Systems',
      industry: 'Enterprise Tech',
      type: 'Annual',
      weeklyPayoutUSD: Math.round(4500 * bonusMult),
      signingBonusUSD: Math.round(20000 * bonusMult),
      weeksRemaining: 52,
      minReputation: 64,
      winBonusUSD: 1500,
      penaltyUSD: 15000,
    },
    {
      brandName: 'Vanguard Global Airlines',
      industry: 'Aviation & Travel',
      type: 'Tournament Bonus',
      weeklyPayoutUSD: Math.round(6800 * bonusMult),
      signingBonusUSD: Math.round(35000 * bonusMult),
      weeksRemaining: 52,
      minReputation: 80,
      winBonusUSD: 4000,
      penaltyUSD: 25000,
    },
  ];

  const activeNames = new Set(state.org.sponsors.map((s) => s.brandName));
  return catalog
    .filter((s) => !activeNames.has(s.brandName) && rep >= s.minReputation - 5)
    .map((s, idx) => ({
      ...s,
      id: `sp_${s.brandName.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
    }));
}

function checkAchievements(state: GameState): { unlocked: string[]; newTitles: string[] } {
  const already = new Set(state.unlockedAchievements);
  const newIds: string[] = [];
  const netWorth = calculatePersonalNetWorthUSD(state);

  const test = (id: string, condition: boolean) => {
    if (condition && !already.has(id)) {
      already.add(id);
      newIds.push(id);
    }
  };

  test('earn_1k', state.finances.lifetimeEarnedUSD >= 1000);
  test('save_10k', state.finances.cashUSD + state.finances.bankBalanceUSD >= 10000);
  test('first_luxury', state.finances.ownedAssetIds.length > 0);
  test('first_investment', state.finances.investments.length > 0);
  test('millionaire', netWorth >= 1_000_000);
  test('org_founded', state.org.founded);
  test('first_pro_signed', state.roster.length > 0);
  test('first_tournament_win', state.org.trophies.length > 0);
  test(
    'first_regional_champ',
    state.org.trophies.some(
      (t) => t.tier === 'Regional Championship' || t.tier === 'National Championship'
    )
  );
  test(
    'first_intl_qual',
    state.recentMatches.some(
      (m) =>
        m.tournamentTier === 'International Qualifier' ||
        m.tournamentTier === 'Major International' ||
        m.tournamentTier === 'World Championship'
    )
  );
  test(
    'first_major_trophy',
    state.org.trophies.some((t) => t.tier === 'Major International')
  );
  test(
    'first_world_champ',
    state.org.trophies.some((t) => t.tier === 'World Championship')
  );

  const highestRivalVal = Math.max(...state.rivals.filter((r) => r.status === 'Active').map((r) => r.valuationUSD), 0);
  test('worlds_most_valuable', state.org.founded && state.org.valuationUSD > highestRivalVal && state.org.reputation >= 50);

  const newTitles = newIds
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id);

  return { unlocked: Array.from(already), newTitles };
}

function maybeTriggerStoryEvent(state: GameState): ActiveStoryEvent | null {
  if (state.pendingEvent) return state.pendingEvent;
  if (Math.random() > 0.34) return null;

  const eligible = STORY_EVENT_TEMPLATES.filter((tpl) => {
    if (tpl.minWeek && state.week < tpl.minWeek) return false;
    if (tpl.requiresOrg && !state.org.founded) return false;
    if (tpl.forbidsOrg && state.org.founded) return false;
    return true;
  });

  if (eligible.length === 0) return null;
  const tpl = eligible[Math.floor(Math.random() * eligible.length)];

  return {
    id: tpl.id,
    title: tpl.title,
    category: tpl.category,
    description: tpl.description,
    choices: tpl.choices.map((c) => ({
      id: c.id,
      label: c.label,
      detail: c.effectDescription,
      costCashUSD: c.requiresCashUSD,
      costOrgUSD: c.requiresOrgBalanceUSD,
    })),
  };
}

export function resolveStoryEventChoice(
  state: GameState,
  choiceId: string
): { nextState: GameState; outcomeText: string } {
  if (!state.pendingEvent) {
    return { nextState: state, outcomeText: '' };
  }
  const tpl = STORY_EVENT_TEMPLATES.find((t) => t.id === state.pendingEvent?.id);
  const choice = tpl?.choices.find((c) => c.id === choiceId);
  if (!tpl || !choice) {
    return {
      nextState: { ...state, pendingEvent: null },
      outcomeText: '',
    };
  }

  const { updated, outcomeText } = choice.apply(state);
  const nextState: GameState = {
    ...updated,
    pendingEvent: null,
    history: [
      {
        id: `evt_${Date.now()}`,
        week: state.week,
        year: state.year,
        category: 'Story' as const,
        title: tpl.title,
        summary: `${choice.label}: ${outcomeText}`,
      },
      ...updated.history,
    ].slice(0, 80),
  };

  return { nextState, outcomeText };
}

export function advanceWeek(state: GameState): GameState {
  const nextWeek = state.week + 1;
  const nextYear = Math.floor((nextWeek - 1) / 52) + 1;
  const highlights: string[] = [];
  const country = getCountryById(state.character.countryId);

  let cash = state.finances.cashUSD;
  let bank = state.finances.bankBalanceUSD;
  let debt = state.finances.debtUSD;

  // 1. Personal Expenses Settlement
  const { total: weeklyExpensesUSD } = calculateWeeklyPersonalExpensesUSD(state);
  let remainingExpense = weeklyExpensesUSD;

  if (cash >= remainingExpense) {
    cash -= remainingExpense;
    remainingExpense = 0;
  } else {
    remainingExpense -= Math.max(0, cash);
    cash = 0;
    if (bank >= remainingExpense) {
      bank -= remainingExpense;
      remainingExpense = 0;
    } else {
      remainingExpense -= Math.max(0, bank);
      bank = 0;
      debt += remainingExpense;
      highlights.push(`Insufficient funds for living expenses (+$${remainingExpense} added to debt).`);
    }
  }

  // Bank interest (0.1% weekly savings yield)
  if (bank > 0) {
    bank += Math.round(bank * 0.001);
  }

  // 2. Investments tick
  let investmentIncome = 0;
  const updatedInvestments = state.finances.investments.map((inv) => {
    const shock = (Math.random() * 2 - 1) * inv.volatility;
    const growthFactor = 1 + inv.weeklyYieldRate + shock;
    const newValue = Math.max(50, Math.round(inv.currentValueUSD * growthFactor));
    const dividend = Math.round(inv.currentValueUSD * Math.max(0, inv.weeklyYieldRate * 0.4));
    investmentIncome += dividend;
    return {
      ...inv,
      currentValueUSD: newValue,
    };
  });
  if (investmentIncome > 0) {
    bank += investmentIncome;
    highlights.push(`Investments generated ${investmentIncome > 0 ? `$${investmentIncome}` : ''} in weekly dividends.`);
  }

  // 3. Employment Progression
  let employment = { ...state.employment };
  if (employment.currentJobId) {
    employment.weeksInRole += 1;
    if (employment.shiftsWorkedThisWeek > 0) {
      employment.consistencyStreak += 1;
    } else {
      employment.consistencyStreak = Math.max(0, employment.consistencyStreak - 1);
    }
    employment.shiftsWorkedThisWeek = 0;

    // Auto-promotion check
    if (
      employment.level < 5 &&
      employment.consistencyStreak >= employment.level * 4 + 2 &&
      Math.random() < 0.45
    ) {
      employment.level = (employment.level + 1) as typeof employment.level;
      highlights.push(`Promotion earned! You advanced to Level ${employment.level} at your job.`);
    }
  }

  // 4. Organization Registration Approval Timer
  let registration = { ...state.registration };
  let org = { ...state.org };
  if (!org.founded && registration.approvalWeeksRemaining > 0) {
    registration.approvalWeeksRemaining -= 1;
    if (registration.approvalWeeksRemaining === 0) {
      org = {
        ...org,
        founded: true,
        name: registration.proposedName.trim() || `${state.character.lastName} Esports`,
        tag: registration.proposedTag.trim().toUpperCase() || 'ESP',
        color: registration.proposedColor,
        icon: registration.proposedIcon,
        foundedWeek: nextWeek,
        bankBalanceUSD: 10000,
        facilityLevel: 1,
        reputation: Math.max(5, Math.round(state.character.reputation * 0.5 + 5)),
        followers: 500 + state.character.connections * 40,
      };
      org.valuationUSD = 32500;
      highlights.push(`Official approval received! ${org.name} (${org.tag}) is now a licensed esports organization.`);
    } else {
      highlights.push(`Organization license under review (${registration.approvalWeeksRemaining} week(s) remaining).`);
    }
  }

  // 5. Organization Weekly Operations (if founded)
  let orgRevenue = 0;
  let orgExpenses = 0;
  let updatedRoster = [...state.roster];

  if (org.founded) {
    const hasFinMgr = org.staff.some((s) => s.roleId === 'financial_manager');
    const hasSocialMgr = org.staff.some((s) => s.roleId === 'social_media_manager');
    const hasContentDir = org.staff.some((s) => s.roleId === 'content_director');
    const hasMarketing = org.staff.some((s) => s.roleId === 'marketing_director');
    const hasAsstCoach = org.staff.some((s) => s.roleId === 'assistant_coach');

    // Facility construction countdown
    if (org.facilityUnderConstruction) {
      const rem = org.facilityUnderConstruction.weeksRemaining - 1;
      if (rem <= 0) {
        const newLevel = org.facilityUnderConstruction.targetLevel;
        const fac = FACILITY_TIERS.find((f) => f.level === newLevel);
        org.facilityLevel = newLevel;
        org.facilityUnderConstruction = null;
        if (fac) {
          org.reputation = Math.min(100, org.reputation + Math.round(fac.reputationBonus * 0.35));
          highlights.push(`Construction complete! ${fac.name} is now operational.`);
        }
      } else {
        org.facilityUnderConstruction = {
          ...org.facilityUnderConstruction,
          weeksRemaining: rem,
        };
      }
    }

    // Revenue: Sponsors + Merch + Content/Media
    const activeSponsors = org.sponsors
      .map((sp) => {
        orgRevenue += sp.weeklyPayoutUSD;
        return { ...sp, weeksRemaining: sp.weeksRemaining - 1 };
      })
      .filter((sp) => sp.weeksRemaining > 0);
    org.sponsors = activeSponsors;

    const merchBase = org.merchBrandLaunched
      ? Math.round(org.followers * 0.04 * (hasMarketing ? 1.25 : 1.0))
      : Math.round(org.followers * 0.01);

    const creatorRev = org.creators.reduce((sum, c) => sum + c.weeklyRevenueUSD, 0);
    const ytRev = org.youtubeLaunched ? Math.round(180 + org.followers * 0.018) : 0;
    const podRev = org.podcastLaunched ? Math.round(140 + org.followers * 0.012) : 0;
    const mediaMult =
      (country.id === 'uk' ? 1.1 : country.id === 'india' ? 1.15 : 1.0) *
      (hasContentDir ? 1.25 : 1.0);

    const totalMediaRev = Math.round((creatorRev + ytRev + podRev) * mediaMult);
    orgRevenue += merchBase + totalMediaRev;

    // Expenses: Player Salaries + Staff Salaries + Facility Maintenance + Creator Salaries
    const playerSalaries = updatedRoster.reduce((s, p) => s + Math.round(p.monthlySalaryUSD / 4), 0);
    const staffSalaries = org.staff.reduce((s, st) => s + st.weeklySalaryUSD, 0);
    const creatorSalaries = org.creators.reduce((s, c) => s + c.weeklySalaryUSD, 0);
    const currentFac = FACILITY_TIERS.find((f) => f.level === org.facilityLevel);
    const facCostBase = currentFac?.weeklyMaintenanceUSD ?? 180;
    const facDisc = (country.id === 'poland' ? 0.85 : 1.0) * (hasFinMgr ? 0.9 : 1.0);
    const facMaintenance = Math.round(facCostBase * facDisc);

    orgExpenses = playerSalaries + staffSalaries + creatorSalaries + facMaintenance;
    org.bankBalanceUSD = org.bankBalanceUSD + orgRevenue - orgExpenses;
    org.lastWeekRevenueUSD = orgRevenue;
    org.lastWeekExpensesUSD = orgExpenses;

    // Passive follower growth
    const followerGrowth =
      Math.round(
        (hasSocialMgr ? 420 : 110) *
          (1 + org.reputation * 0.03) *
          (country.id === 'brazil' ? 1.2 : country.id === 'india' ? 1.25 : 1.0)
      ) + org.creators.length * 160;
    org.followers += followerGrowth;

    // Roster contract countdown & natural development
    const facTrainingBonus = currentFac?.trainingBonus ?? 4;
    const devRate = (facTrainingBonus * 0.015 + (hasAsstCoach ? 0.25 : 0)) * (country.id === 'south_korea' ? 1.12 : 1.0);

    updatedRoster = updatedRoster.map((p) => {
      const weeksLeft = p.contractWeeksLeft - 1;
      const canGrow = p.overall < p.attributes.potential && Math.random() < 0.25 + devRate * 0.15;
      const newAttrs = canGrow
        ? {
            ...p.attributes,
            mechanicalSkill: Math.min(99, p.attributes.mechanicalSkill + 1),
            gameSense: Math.min(99, p.attributes.gameSense + 1),
          }
        : p.attributes;
      const newOverall = canGrow ? Math.min(99, p.overall + 1) : p.overall;

      return {
        ...p,
        contractWeeksLeft: Math.max(0, weeksLeft),
        attributes: newAttrs,
        overall: newOverall,
      };
    });

    // Reset division weekly training flag
    org.divisions = org.divisions.map((d) => ({
      ...d,
      trainedThisWeek: false,
    }));

    if (org.bankBalanceUSD < 0) {
      highlights.push(`Warning: ${org.name} operating balance is negative (${Math.round(org.bankBalanceUSD)} USD). Transfer funds or cut costs.`);
    }
  }

  // 6. Autonomous Rival AI & World Simulation
  const newWorldNews = [...state.worldNews];
  const updatedRivals = state.rivals.map((r) => {
    if (r.status === 'Bankrupt' || r.status === 'Acquired') return r;
    const delta = Math.round((Math.random() - 0.46) * 45000);
    const strDelta = Math.random() < 0.25 ? (Math.random() < 0.52 ? 1 : -1) : 0;
    const newBal = r.bankBalanceUSD + delta;
    const newVal = Math.max(150000, r.valuationUSD + delta * 2);
    const newStrength = Math.max(60, Math.min(96, r.strength + strDelta));

    let status: RivalOrganization['status'] = 'Active';
    if (newBal < 40000 && Math.random() < 0.2) {
      status = 'Bankrupt';
      newWorldNews.unshift({
        id: `news_bk_${r.id}_${nextWeek}`,
        week: nextWeek,
        headline: `${r.name} Files for Restructuring Bankruptcy`,
        body: `Rising player salaries and missed international playoffs forced ${r.name} to pause operations.`,
      });
    } else if (newBal < 180000) {
      status = 'Declining';
    }

    return {
      ...r,
      bankBalanceUSD: Math.max(0, newBal),
      valuationUSD: newVal,
      strength: newStrength,
      status,
      recentTrend: strDelta > 0 ? ('Rising' as const) : strDelta < 0 ? ('Slumping' as const) : ('Steady' as const),
    };
  });

  // Occasional world tournament headline
  if (nextWeek % 4 === 0) {
    const activeRivals = updatedRivals.filter((r) => r.status === 'Active');
    if (activeRivals.length > 0) {
      const champ = activeRivals[Math.floor(Math.random() * activeRivals.length)];
      champ.trophies += 1;
      champ.reputation = Math.min(99, champ.reputation + 1);
      newWorldNews.unshift({
        id: `news_trn_${nextWeek}`,
        week: nextWeek,
        headline: `${champ.name} Captures International Invitational Title`,
        body: `${champ.name} climbed in the global rankings after sweeping the weekend finals.`,
      });
    }
  }

  // Refresh open tournaments for org's active divisions if completed
  let updatedTournaments = [...state.tournaments];
  org.divisions.forEach((div) => {
    const openForDiv = updatedTournaments.filter(
      (t) => t.gameId === div.gameId && t.status !== 'Completed'
    );
    if (openForDiv.length < 4) {
      const fresh = generateTournamentsForGame(div.gameId, nextWeek, updatedRivals);
      const existingIds = new Set(updatedTournaments.map((t) => t.id));
      fresh.forEach((f) => {
        if (!existingIds.has(f.id)) updatedTournaments.push(f);
      });
    }
  });
  // Prune old completed tournaments beyond recent 20
  const openOrActive = updatedTournaments.filter((t) => t.status !== 'Completed');
  const completed = updatedTournaments.filter((t) => t.status === 'Completed').slice(0, 12);
  updatedTournaments = [...openOrActive, ...completed];

  // Refresh a few free agents periodically
  let updatedMarket = [...state.marketPlayers];
  if (nextWeek % 3 === 0 && updatedMarket.length < 95) {
    const tiers = ['Amateur', 'Semi-professional', 'Professional', 'Established professional'] as const;
    const randomGame = org.divisions[0]?.gameId ?? 'vanguard_protocol';
    updatedMarket.unshift(
      generatePlayer(randomGame, tiers[Math.floor(Math.random() * tiers.length)], nextWeek)
    );
  }

  // Age character every 52 weeks
  const newAge = nextWeek % 52 === 1 && nextWeek > 1 ? state.character.age + 1 : state.character.age;

  let nextState: GameState = {
    ...state,
    week: nextWeek,
    year: nextYear,
    energy: state.maxEnergy,
    character: {
      ...state.character,
      age: newAge,
    },
    employment,
    finances: {
      ...state.finances,
      cashUSD: cash,
      bankBalanceUSD: bank,
      debtUSD: debt,
      investments: updatedInvestments,
      lastWeekIncomeUSD: investmentIncome,
      lastWeekExpensesUSD: weeklyExpensesUSD,
      lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + investmentIncome,
    },
    registration,
    org,
    roster: updatedRoster,
    marketPlayers: updatedMarket,
    rivals: updatedRivals,
    tournaments: updatedTournaments,
    worldNews: newWorldNews.slice(0, 25),
    activitiesThisWeek: [],
    lastWeeklyRecap: {
      week: state.week,
      year: state.year,
      personalIncomeUSD: state.finances.lastWeekIncomeUSD + investmentIncome,
      personalExpensesUSD: weeklyExpensesUSD,
      orgRevenueUSD: orgRevenue,
      orgExpensesUSD: orgExpenses,
      highlights,
    },
  };

  if (nextState.org.founded) {
    nextState.org.valuationUSD = calculateOrgValuationUSD(nextState);
  }

  // Check Achievements
  const ach = checkAchievements(nextState);
  if (ach.newTitles.length > 0) {
    nextState.unlockedAchievements = ach.unlocked;
    nextState.lastWeeklyRecap = {
      ...nextState.lastWeeklyRecap!,
      highlights: [
        ...nextState.lastWeeklyRecap!.highlights,
        ...ach.newTitles.map((t) => `Achievement unlocked: ${t}`),
      ],
    };
  }

  // Random / Story Event trigger
  nextState.pendingEvent = maybeTriggerStoryEvent(nextState);

  return nextState;
}

export function getStaffRoleTitle(roleId: string): string {
  return STAFF_ROLES.find((r) => r.id === roleId)?.title ?? roleId;
}
