import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Gamepad2,
  Globe2,
  Home,
  Moon,
  Save,
  Sun,
} from 'lucide-react';
import { BusinessView } from './components/BusinessView';
import { CareerView } from './components/CareerView';
import { CharacterCreation } from './components/CharacterCreation';
import { EsportsView } from './components/EsportsView';
import { HomeView } from './components/HomeView';
import { EndingModal, EventModal, MatchModal, SaveModal } from './components/Modals';
import { StoryView } from './components/StoryView';
import { WorldView } from './components/WorldView';
import { getGameById } from './data/esportsTitles';
import { FACILITY_TIERS, STAFF_ROLES } from './data/facilitiesAndStaff';
import { EDUCATION_PROGRAMS, JOBS } from './data/jobs';
import { INVESTMENT_PRODUCTS, LIFESTYLE_ITEMS } from './data/lifestyleAndInvestments';
import { calculateOrgValuationUSD, formatCurrency } from './engine/economy';
import { simulateMatch } from './engine/matchEngine';
import { evaluateContractOffer } from './engine/playerGenerator';
import {
  deleteSaveSlot,
  getLastActiveSlotId,
  listSaveSlots,
  loadGameFromSlot,
  saveGameToSlot,
  SaveSlotSummary,
} from './engine/storage';
import {
  advanceWeek,
  calculateShiftIncomeUSD,
  createNewGameState,
  generateAvailableSponsors,
  getEnergyCosts,
  resolveStoryEventChoice,
} from './engine/weeklyEngine';
import {
  ActiveTournament,
  CharacterProfile,
  CharacterSkills,
  ContentCreator,
  EducationLevel,
  GameState,
  LifestyleTier,
  MatchStrategy,
  NavTab,
  StaffRoleId,
} from './types/game';

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'career', label: 'Career', icon: Briefcase },
  { id: 'esports', label: 'Esports', icon: Gamepad2 },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'world', label: 'World', icon: Globe2 },
  { id: 'story', label: 'Story', icon: BookOpen },
];

const STAFF_NAMES = [
  'Jordan Vance',
  'Elena Rostova',
  'Marcus Chen',
  'Sora Takahashi',
  'David Lindqvist',
  'Priya Nair',
  'Lucas Meyer',
  'Hannah Kim',
];

const CREATOR_HANDLES = [
  'KiraLive',
  'ApexDaily',
  'FrameByFrame',
  'ClutchCast',
  'ValkyrieTV',
  'GridlineGG',
];

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    const lastSlot = getLastActiveSlotId();
    if (lastSlot) {
      return loadGameFromSlot(lastSlot);
    }
    return null;
  });

  const [saves, setSaves] = useState<SaveSlotSummary[]>(() => listSaveSlots());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeMatchTournament, setActiveMatchTournament] = useState<ActiveTournament | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const commitState = (next: GameState, toastMessage?: string) => {
    setGameState(next);
    saveGameToSlot(next, next.saveSlotId);
    setSaves(listSaveSlots());
    if (toastMessage) {
      setFeedback(toastMessage);
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleStartNewGame = (character: CharacterProfile, slotId: string) => {
    const fresh = createNewGameState(character, slotId);
    saveGameToSlot(fresh, slotId);
    setSaves(listSaveSlots());
    setGameState(fresh);
    setActiveTab('home');
    setFeedback(`Career started in ${character.city}. Good luck!`);
  };

  const handleLoadSave = (slotId: string) => {
    const loaded = loadGameFromSlot(slotId);
    if (loaded) {
      setGameState(loaded);
      setActiveTab('home');
      setFeedback(`Loaded ${loaded.character.firstName} ${loaded.character.lastName} (Week ${loaded.week}).`);
    }
  };

  const handleDeleteSave = (slotId: string) => {
    deleteSaveSlot(slotId);
    setSaves(listSaveSlots());
  };

  if (!gameState) {
    return (
      <CharacterCreation
        existingSaves={saves}
        onStartNewGame={handleStartNewGame}
        onLoadSave={handleLoadSave}
        onDeleteSave={handleDeleteSave}
      />
    );
  }

  const deductPersonalMoney = (state: GameState, amountUSD: number): GameState | null => {
    const total = state.finances.cashUSD + state.finances.bankBalanceUSD;
    if (total < amountUSD) return null;
    let cash = state.finances.cashUSD;
    let bank = state.finances.bankBalanceUSD;
    if (cash >= amountUSD) {
      cash -= amountUSD;
    } else {
      const rem = amountUSD - cash;
      cash = 0;
      bank -= rem;
    }
    return {
      ...state,
      finances: {
        ...state.finances,
        cashUSD: cash,
        bankBalanceUSD: bank,
      },
    };
  };

  /* --------------------------- Action Handlers ---------------------------- */
  const handleWorkShift = () => {
    const job = JOBS.find((j) => j.id === gameState.employment.currentJobId);
    if (!job) return;
    if (gameState.energy < job.energyCost) {
      setFeedback('Not enough energy remaining this week.');
      return;
    }
    if (gameState.employment.shiftsWorkedThisWeek >= job.maxShiftsPerWeek) {
      setFeedback('Maximum shifts reached for this job this week.');
      return;
    }
    const payUSD = calculateShiftIncomeUSD(gameState);
    commitState(
      {
        ...gameState,
        energy: gameState.energy - job.energyCost,
        employment: {
          ...gameState.employment,
          shiftsWorkedThisWeek: gameState.employment.shiftsWorkedThisWeek + 1,
        },
        finances: {
          ...gameState.finances,
          cashUSD: gameState.finances.cashUSD + payUSD,
          lastWeekIncomeUSD: gameState.finances.lastWeekIncomeUSD + payUSD,
          lifetimeEarnedUSD: gameState.finances.lifetimeEarnedUSD + payUSD,
        },
        character: {
          ...gameState.character,
          skills: {
            ...gameState.character.skills,
            workEthic: Math.min(100, gameState.character.skills.workEthic + 1),
          },
        },
      },
      `Worked ${job.title} shift: +${formatCurrency(payUSD, gameState.character.countryId)}`
    );
  };

  const handleBusinessResearch = () => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.research) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.research,
        character: {
          ...gameState.character,
          skills: {
            ...gameState.character.skills,
            businessAcumen: Math.min(100, gameState.character.skills.businessAcumen + 2),
            esportsKnowledge: Math.min(100, gameState.character.skills.esportsKnowledge + 2),
          },
        },
      },
      'Completed industry research (+2 Business Acumen, +2 Esports Knowledge).'
    );
  };

  const handleNetworking = () => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.networking) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.networking,
        character: {
          ...gameState.character,
          connections: gameState.character.connections + 3,
          reputation: Math.min(100, gameState.character.reputation + 1),
          skills: {
            ...gameState.character.skills,
            negotiation: Math.min(100, gameState.character.skills.negotiation + 2),
          },
        },
      },
      'Networked with industry peers (+3 Connections, +1 Reputation, +2 Negotiation).'
    );
  };

  const handleAdvanceWeek = () => {
    const next = advanceWeek(gameState);
    commitState(next, `Advanced to Year ${next.year}, Week ${next.week}. Energy refreshed to 100.`);
    if (next.pendingEvent) {
      setShowEventModal(true);
    }
  };

  const handleApplyJob = (jobId: string) => {
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) return;
    commitState(
      {
        ...gameState,
        employment: {
          currentJobId: jobId,
          level: 1,
          weeksInRole: 0,
          consistencyStreak: 0,
          shiftsWorkedThisWeek: 0,
        },
        history: [
          {
            id: `job_${Date.now()}`,
            week: gameState.week,
            year: gameState.year,
            category: 'Career' as const,
            title: `Hired as ${job.title}`,
            summary: `Started a new position as ${job.title}.`,
          },
          ...gameState.history,
        ].slice(0, 80),
      },
      `You are now employed as a ${job.title}.`
    );
  };

  const handleResignJob = () => {
    commitState(
      {
        ...gameState,
        employment: {
          currentJobId: null,
          level: 1,
          weeksInRole: 0,
          consistencyStreak: 0,
          shiftsWorkedThisWeek: 0,
        },
      },
      'Resigned from your current job.'
    );
  };

  const handleTrainSkill = (skillKey: keyof CharacterSkills) => {
    if (gameState.energy < 20) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - 20,
        character: {
          ...gameState.character,
          skills: {
            ...gameState.character.skills,
            [skillKey]: Math.min(100, gameState.character.skills[skillKey] + 3),
          },
        },
      },
      'Skill training complete (+3 points).'
    );
  };

  const handleStudyProgram = (level: EducationLevel) => {
    const prog = EDUCATION_PROGRAMS.find((p) => p.level === level);
    if (!prog || gameState.energy < prog.energyCost) return;
    const afterPay = deductPersonalMoney(gameState, prog.tuitionUSD);
    if (!afterPay) return;
    const skills = { ...afterPay.character.skills };
    if (level === 'Vocational Certificate') skills.businessAcumen = Math.min(100, skills.businessAcumen + 8);
    if (level === 'Associate Degree') {
      skills.businessAcumen = Math.min(100, skills.businessAcumen + 10);
      skills.negotiation = Math.min(100, skills.negotiation + 6);
    }
    if (level === 'Bachelor of Business') {
      skills.leadership = Math.min(100, skills.leadership + 12);
      skills.marketing = Math.min(100, skills.marketing + 10);
    }
    if (level === 'MBA') {
      skills.businessAcumen = Math.min(100, skills.businessAcumen + 15);
      skills.leadership = Math.min(100, skills.leadership + 12);
    }

    commitState(
      {
        ...afterPay,
        energy: afterPay.energy - prog.energyCost,
        character: {
          ...afterPay.character,
          education: level,
          skills,
        },
        history: [
          {
            id: `edu_${Date.now()}`,
            week: afterPay.week,
            year: afterPay.year,
            category: 'Career' as const,
            title: `Earned ${level}`,
            summary: `Completed ${level} studies, expanding executive skills and job eligibility.`,
          },
          ...afterPay.history,
        ].slice(0, 80),
      },
      `Congratulations! Earned ${level}.`
    );
  };

  /* -------------------- Organization & Esports Handlers ------------------- */
  const handlePayRegistrationStep = (
    step: keyof Pick<
      GameState['registration'],
      | 'businessRegistered'
      | 'licenseAcquired'
      | 'legalDocsDone'
      | 'brandingDone'
      | 'marketingLaunchDone'
      | 'initialReserveDeposited'
    >,
    costUSD: number
  ) => {
    const afterPay = deductPersonalMoney(gameState, costUSD);
    if (!afterPay) {
      setFeedback('Insufficient personal funds.');
      return;
    }
    commitState(
      {
        ...afterPay,
        registration: {
          ...afterPay.registration,
          [step]: true,
        },
      },
      'Registration milestone completed.'
    );
  };

  const handleSubmitOrgRegistration = () => {
    if (gameState.energy < 60) return;
    const approvalWeeks = gameState.character.countryId === 'singapore' ? 1 : 2;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - 60,
        registration: {
          ...gameState.registration,
          approvalWeeksRemaining: approvalWeeks,
        },
        history: [
          {
            id: `org_apply_${Date.now()}`,
            week: gameState.week,
            year: gameState.year,
            category: 'Esports' as const,
            title: `Filed Charter for ${gameState.registration.proposedName}`,
            summary: `Submitted final incorporation and esports license paperwork (${approvalWeeks}-week review).`,
          },
          ...gameState.history,
        ].slice(0, 80),
      },
      `Charter filed! Approval expected in ${approvalWeeks} week(s).`
    );
  };

  const handleOpenDivision = (gameId: string) => {
    if (gameState.org.bankBalanceUSD < 2500) return;
    const game = getGameById(gameId);
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD - 2500,
          divisions: [
            ...gameState.org.divisions,
            {
              gameId,
              chemistry: 65,
              tacticalPrep: 50,
              rankingPoints: 0,
              worldRank: 120,
              wins: 0,
              losses: 0,
              titlesWon: 0,
              trainedThisWeek: false,
            },
          ],
        },
      },
      `Opened ${game.name} competitive division.`
    );
  };

  const handleTrainDivision = (gameId: string) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.training) return;
    const fac = FACILITY_TIERS.find((f) => f.level === gameState.org.facilityLevel);
    const chemGain = 4 + Math.round((fac?.trainingBonus ?? 4) * 0.15);

    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.training,
        org: {
          ...gameState.org,
          divisions: gameState.org.divisions.map((d) =>
            d.gameId === gameId
              ? {
                  ...d,
                  trainedThisWeek: true,
                  chemistry: Math.min(100, d.chemistry + chemGain),
                }
              : d
          ),
        },
        roster: gameState.roster.map((p) =>
          p.gameId === gameId
            ? {
                ...p,
                form: Math.min(100, p.form + 4),
              }
            : p
        ),
      },
      'Team scrims complete: boosted form and division chemistry.'
    );
  };

  const handlePrepDivision = (gameId: string) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.tournamentPrep) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.tournamentPrep,
        org: {
          ...gameState.org,
          divisions: gameState.org.divisions.map((d) =>
            d.gameId === gameId
              ? { ...d, tacticalPrep: Math.min(100, d.tacticalPrep + 12) }
              : d
          ),
        },
      },
      'Tactical VOD review complete (+12 Tactical Prep).'
    );
  };

  const handleToggleStarter = (playerId: string) => {
    const target = gameState.roster.find((p) => p.id === playerId);
    if (!target) return;
    const game = getGameById(target.gameId);
    const currentStarters = gameState.roster.filter(
      (p) => p.gameId === target.gameId && p.isStarter
    ).length;

    if (!target.isStarter && currentStarters >= game.rosterSize) {
      setFeedback(`${game.name} allows up to ${game.rosterSize} starters. Move a starter to bench first.`);
      return;
    }

    commitState({
      ...gameState,
      roster: gameState.roster.map((p) =>
        p.id === playerId ? { ...p, isStarter: !p.isStarter } : p
      ),
    });
  };

  const handleSetCaptain = (playerId: string) => {
    const target = gameState.roster.find((p) => p.id === playerId);
    if (!target) return;
    commitState(
      {
        ...gameState,
        roster: gameState.roster.map((p) =>
          p.gameId === target.gameId ? { ...p, isCaptain: p.id === playerId } : p
        ),
      },
      `${target.ign} appointed Team Captain.`
    );
  };

  const handleRenewPlayer = (playerId: string) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.contractNegotiation) return;
    const target = gameState.roster.find((p) => p.id === playerId);
    if (!target) return;

    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.contractNegotiation,
        roster: gameState.roster.map((p) =>
          p.id === playerId
            ? { ...p, contractWeeksLeft: p.contractWeeksLeft + 36, morale: Math.min(100, p.morale + 8) }
            : p
        ),
      },
      `Extended ${target.ign}'s contract by 36 weeks.`
    );
  };

  const handleReleasePlayer = (playerId: string) => {
    const target = gameState.roster.find((p) => p.id === playerId);
    if (!target) return;
    commitState(
      {
        ...gameState,
        roster: gameState.roster.filter((p) => p.id !== playerId),
        marketPlayers: [{ ...target, orgId: null, isStarter: false, isCaptain: false }, ...gameState.marketPlayers],
      },
      `Released ${target.ign} to free agency.`
    );
  };

  const handleScoutPlayer = (playerId: string) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.scouting) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.scouting,
        marketPlayers: gameState.marketPlayers.map((p) =>
          p.id === playerId ? { ...p, scouted: true } : p
        ),
      },
      'Scouting dossier unlocked full player attributes.'
    );
  };

  const handleNegotiatePlayer = (playerId: string, offeredMonthlyUSD: number) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.contractNegotiation) return;
    const player = gameState.marketPlayers.find((p) => p.id === playerId);
    if (!player) return;

    const signingFeeUSD = Math.round(offeredMonthlyUSD * 0.5);
    if (gameState.org.bankBalanceUSD < signingFeeUSD) {
      setFeedback('Organization bank cannot cover the signing fee.');
      return;
    }

    const evaluation = evaluateContractOffer(gameState, player, offeredMonthlyUSD);
    if (!evaluation.accepted) {
      commitState(
        {
          ...gameState,
          energy: gameState.energy - costs.contractNegotiation,
        },
        evaluation.reason
      );
      return;
    }

    const game = getGameById(player.gameId);
    const currentStarters = gameState.roster.filter(
      (p) => p.gameId === player.gameId && p.isStarter
    ).length;

    const signedPlayer = {
      ...player,
      orgId: 'player_org',
      monthlySalaryUSD: offeredMonthlyUSD,
      contractWeeksLeft: 36,
      scouted: true,
      isStarter: currentStarters < game.rosterSize,
      isCaptain: gameState.roster.filter((p) => p.gameId === player.gameId).length === 0,
    };

    const nextState: GameState = {
      ...gameState,
      energy: gameState.energy - costs.contractNegotiation,
      org: {
        ...gameState.org,
        bankBalanceUSD: gameState.org.bankBalanceUSD - signingFeeUSD,
      },
      roster: [...gameState.roster, signedPlayer],
      marketPlayers: gameState.marketPlayers.filter((p) => p.id !== playerId),
      history: [
        {
          id: `sign_${Date.now()}`,
          week: gameState.week,
          year: gameState.year,
          category: 'Esports' as const,
          title: `Signed ${player.ign} (${game.name})`,
          summary: `Agreed to ${formatCurrency(offeredMonthlyUSD, gameState.character.countryId)}/mo contract.`,
        },
        ...gameState.history,
      ].slice(0, 80),
    };
    nextState.org.valuationUSD = calculateOrgValuationUSD(nextState);
    commitState(nextState, evaluation.reason);
  };

  const handleEnterTournament = (tournamentId: string) => {
    const trn = gameState.tournaments.find((t) => t.id === tournamentId);
    if (!trn || gameState.org.bankBalanceUSD < trn.entryFeeUSD) return;
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD - trn.entryFeeUSD,
        },
        tournaments: gameState.tournaments.map((t) =>
          t.id === tournamentId ? { ...t, status: 'In Progress' } : t
        ),
      },
      `Registered for ${trn.name}! Click "Play Match" to compete.`
    );
  };

  const handleSimulateMatch = (
    tournament: ActiveTournament,
    opponent: { id: string; name: string; strength: number },
    strategy: MatchStrategy
  ) => {
    const { report, updatedState } = simulateMatch(gameState, tournament, opponent, strategy);
    updatedState.org.valuationUSD = calculateOrgValuationUSD(updatedState);
    commitState(
      updatedState,
      report.won
        ? `Victory over ${opponent.name} (${report.scoreLine})!`
        : `Lost ${report.scoreLine} to ${opponent.name}.`
    );
    return report;
  };

  /* -------------------- Business, Staff, Media, Lifestyle ----------------- */
  const handleDepositToBank = (amountUSD: number) => {
    if (gameState.finances.cashUSD < amountUSD) return;
    commitState(
      {
        ...gameState,
        finances: {
          ...gameState.finances,
          cashUSD: gameState.finances.cashUSD - amountUSD,
          bankBalanceUSD: gameState.finances.bankBalanceUSD + amountUSD,
        },
      },
      `Deposited ${formatCurrency(amountUSD, gameState.character.countryId)} to bank savings.`
    );
  };

  const handleWithdrawFromBank = (amountUSD: number) => {
    if (gameState.finances.bankBalanceUSD < amountUSD) return;
    commitState(
      {
        ...gameState,
        finances: {
          ...gameState.finances,
          cashUSD: gameState.finances.cashUSD + amountUSD,
          bankBalanceUSD: gameState.finances.bankBalanceUSD - amountUSD,
        },
      },
      `Withdrew ${formatCurrency(amountUSD, gameState.character.countryId)} to wallet cash.`
    );
  };

  const handlePayDebt = (amountUSD: number) => {
    const afterPay = deductPersonalMoney(gameState, amountUSD);
    if (!afterPay) return;
    commitState(
      {
        ...afterPay,
        finances: {
          ...afterPay.finances,
          debtUSD: Math.max(0, afterPay.finances.debtUSD - amountUSD),
        },
      },
      `Paid ${formatCurrency(amountUSD, gameState.character.countryId)} toward personal debt.`
    );
  };

  const handleSetLifestyle = (tier: LifestyleTier) => {
    commitState(
      {
        ...gameState,
        finances: { ...gameState.finances, lifestyle: tier },
      },
      `Switched to ${tier === 'basic' ? 'Basic' : 'Expensive'} lifestyle.`
    );
  };

  const handleTransferPersonalToOrg = (amountUSD: number) => {
    const afterPay = deductPersonalMoney(gameState, amountUSD);
    if (!afterPay) return;
    const next = {
      ...afterPay,
      org: {
        ...afterPay.org,
        bankBalanceUSD: afterPay.org.bankBalanceUSD + amountUSD,
      },
    };
    next.org.valuationUSD = calculateOrgValuationUSD(next);
    commitState(
      next,
      `Transferred ${formatCurrency(amountUSD, gameState.character.countryId)} into ${next.org.name}.`
    );
  };

  const handleUpgradeFacility = (targetLevel: number) => {
    const fac = FACILITY_TIERS.find((f) => f.level === targetLevel);
    const costs = getEnergyCosts(gameState);
    if (!fac || gameState.org.bankBalanceUSD < fac.costUSD || gameState.energy < costs.orgManagement) return;
    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.orgManagement,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD - fac.costUSD,
          facilityUnderConstruction: {
            targetLevel,
            weeksRemaining: fac.constructionWeeks,
          },
        },
      },
      `Started construction on ${fac.name} (${fac.constructionWeeks} week build time).`
    );
  };

  const handleHireStaff = (roleId: StaffRoleId) => {
    const role = STAFF_ROLES.find((r) => r.id === roleId);
    if (!role) return;
    const name = STAFF_NAMES[Math.floor(Math.random() * STAFF_NAMES.length)];
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          staff: [
            ...gameState.org.staff,
            {
              id: `st_${Date.now()}`,
              roleId,
              name,
              skill: 72 + Math.floor(Math.random() * 18),
              experience: 5 + Math.floor(Math.random() * 8),
              weeklySalaryUSD: role.baseWeeklySalaryUSD,
            },
          ],
        },
      },
      `Hired ${name} as ${role.title}.`
    );
  };

  const handleFireStaff = (staffId: string) => {
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          staff: gameState.org.staff.filter((s) => s.id !== staffId),
        },
      },
      'Staff contract ended.'
    );
  };

  const handleSignSponsor = (sponsorId: string) => {
    const costs = getEnergyCosts(gameState);
    if (gameState.energy < costs.contractNegotiation) return;
    const available = generateAvailableSponsors(gameState);
    const deal = available.find((s) => s.id === sponsorId);
    if (!deal) return;

    commitState(
      {
        ...gameState,
        energy: gameState.energy - costs.contractNegotiation,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD + deal.signingBonusUSD,
          sponsors: [...gameState.org.sponsors, deal],
          reputation: Math.min(100, gameState.org.reputation + 2),
        },
      },
      `Signed sponsorship with ${deal.brandName}! Received ${formatCurrency(deal.signingBonusUSD, gameState.character.countryId)} signing bonus.`
    );
  };

  const handleLaunchMediaInitiative = (kind: 'youtube' | 'podcast' | 'merch') => {
    const costMap = { youtube: 3000, podcast: 1800, merch: 5000 };
    const cost = costMap[kind];
    if (gameState.org.bankBalanceUSD < cost) return;
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD - cost,
          youtubeLaunched: kind === 'youtube' ? true : gameState.org.youtubeLaunched,
          podcastLaunched: kind === 'podcast' ? true : gameState.org.podcastLaunched,
          merchBrandLaunched: kind === 'merch' ? true : gameState.org.merchBrandLaunched,
          followers: gameState.org.followers + 2000,
        },
      },
      `Launched ${kind === 'youtube' ? 'YouTube Studio' : kind === 'podcast' ? 'Esports Podcast' : 'Merchandise Brand'}!`
    );
  };

  const handleHireCreator = (specialty: ContentCreator['specialty']) => {
    if (gameState.org.bankBalanceUSD < 2000) return;
    const handle = `${CREATOR_HANDLES[Math.floor(Math.random() * CREATOR_HANDLES.length)]}_${Math.floor(10 + Math.random() * 89)}`;
    const salary = 420;
    const rev = 680 + Math.round(gameState.org.reputation * 9);
    commitState(
      {
        ...gameState,
        org: {
          ...gameState.org,
          bankBalanceUSD: gameState.org.bankBalanceUSD - 2000,
          followers: gameState.org.followers + 3500,
          creators: [
            ...gameState.org.creators,
            {
              id: `crt_${Date.now()}`,
              handle,
              specialty,
              followers: 45000,
              quality: 78,
              weeklySalaryUSD: salary,
              weeklyRevenueUSD: rev,
            },
          ],
        },
      },
      `Signed ${specialty} ${handle} (+3,500 followers).`
    );
  };

  const handleBuyLifestyleAsset = (assetId: string) => {
    const item = LIFESTYLE_ITEMS.find((i) => i.id === assetId);
    if (!item) return;
    const afterPay = deductPersonalMoney(gameState, item.priceUSD);
    if (!afterPay) return;
    commitState(
      {
        ...afterPay,
        finances: {
          ...afterPay.finances,
          ownedAssetIds: [...afterPay.finances.ownedAssetIds, item.id],
        },
        character: {
          ...afterPay.character,
          reputation: Math.min(100, afterPay.character.reputation + item.reputationBonus),
          connections: afterPay.character.connections + item.connectionsBonus,
        },
      },
      `Purchased ${item.name}!`
    );
  };

  const handleInvest = (productId: string, amountUSD: number) => {
    const prod = INVESTMENT_PRODUCTS.find((p) => p.id === productId);
    if (!prod) return;
    const afterPay = deductPersonalMoney(gameState, amountUSD);
    if (!afterPay) return;

    const existing = afterPay.finances.investments.find((i) => i.id === productId);
    const updatedInv = existing
      ? afterPay.finances.investments.map((i) =>
          i.id === productId
            ? {
                ...i,
                investedUSD: i.investedUSD + amountUSD,
                currentValueUSD: i.currentValueUSD + amountUSD,
              }
            : i
        )
      : [
          ...afterPay.finances.investments,
          {
            id: prod.id,
            name: prod.name,
            category: prod.category,
            riskLevel: prod.riskLevel,
            investedUSD: amountUSD,
            currentValueUSD: amountUSD,
            weeklyYieldRate: prod.weeklyYieldRate,
            volatility: prod.volatility,
          },
        ];

    commitState(
      {
        ...afterPay,
        finances: {
          ...afterPay.finances,
          investments: updatedInv,
        },
      },
      `Invested ${formatCurrency(amountUSD, gameState.character.countryId)} into ${prod.name}.`
    );
  };

  const handleSellInvestment = (holdingId: string) => {
    const holding = gameState.finances.investments.find((i) => i.id === holdingId);
    if (!holding) return;
    commitState(
      {
        ...gameState,
        finances: {
          ...gameState.finances,
          bankBalanceUSD: gameState.finances.bankBalanceUSD + holding.currentValueUSD,
          investments: gameState.finances.investments.filter((i) => i.id !== holdingId),
        },
      },
      `Liquidated ${holding.name} for ${formatCurrency(holding.currentValueUSD, gameState.character.countryId)}.`
    );
  };

  const handleResolveEvent = (choiceId: string) => {
    const { nextState, outcomeText } = resolveStoryEventChoice(gameState, choiceId);
    commitState(nextState, outcomeText);
    setShowEventModal(false);
  };

  const handleTriggerEnding = (endingId: string) => {
    let ending = null;
    let nextState = { ...gameState };

    if (endingId === 'biggest_org') {
      ending = {
        id: 'biggest_org',
        title: "The World's Largest Esports Empire",
        subtitle: `${gameState.org.name} Tops Global Valuations`,
        summary: `From $100 at age 18 in ${gameState.character.city} to leading the most valuable esports organization on Earth, ${gameState.character.firstName} ${gameState.character.lastName} reshaped the competitive landscape.`,
        achievedWeek: gameState.week,
      };
    } else if (endingId === 'world_dynasty') {
      ending = {
        id: 'world_dynasty',
        title: 'Multi-Time World Championship Dynasty',
        subtitle: 'Immortalized on the Championship Stage',
        summary: `With multiple World Championship trophies under the ${gameState.org.name} banner, your rosters defined an entire era of international competition.`,
        achievedWeek: gameState.week,
      };
    } else if (endingId === 'multi_game_empire') {
      ending = {
        id: 'multi_game_empire',
        title: 'Global Multi-Title Powerhouse',
        subtitle: `${gameState.org.divisions.length} Active Divisions · ${gameState.org.trophies.length} Trophies`,
        summary: `${gameState.org.name} conquered multiple distinct competitive genres simultaneously, proving unmatched organizational depth.`,
        achievedWeek: gameState.week,
      };
    } else if (endingId === 'sell_org') {
      const buyout = gameState.org.valuationUSD;
      nextState = {
        ...nextState,
        finances: {
          ...nextState.finances,
          bankBalanceUSD: nextState.finances.bankBalanceUSD + buyout,
        },
      };
      ending = {
        id: 'sell_org',
        title: 'Golden Exit & Industry Investor',
        subtitle: `Sold ${gameState.org.name} for ${formatCurrency(buyout, gameState.character.countryId, true)}`,
        summary: `You completed a landmark acquisition of ${gameState.org.name}, cashing out into your personal fortune to operate as an esports angel investor.`,
        achievedWeek: gameState.week,
      };
    } else if (endingId === 'billionaire_retirement') {
      ending = {
        id: 'billionaire_retirement',
        title: 'Billionaire Retirement',
        subtitle: 'From Humble Beginnings to Ten-Figure Wealth',
        summary: `Having amassed over a billion in personal net worth alongside an iconic career, ${gameState.character.firstName} stepped away on top.`,
        achievedWeek: gameState.week,
      };
    }

    if (ending) {
      commitState({ ...nextState, ending });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 justify-between z-30">
        <div className="space-y-6">
          <div className="px-2">
            <div className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Life Empire: Esports
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {gameState.character.firstName} {gameState.character.lastName} · Age {gameState.character.age}
            </div>
          </div>

          <nav className="space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.id === 'story' && gameState.pendingEvent && (
                    <span className="ml-auto text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                      1
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleAdvanceWeek}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white text-sm font-display font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            Advance Week
            <ArrowRight size={15} />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Save size={14} />
              Saves
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Compact Sticky Header (Mobile <= 52px, Desktop clean bar) */}
        <header className="sticky top-0 z-20 h-[52px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Yr {gameState.year} · Wk {gameState.week}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="text-xs font-mono tabular-nums whitespace-nowrap">
              <span className="text-slate-400 mr-1">EN</span>
              <strong className={gameState.energy < 25 ? 'text-amber-600' : ''}>
                {gameState.energy}/100
              </strong>
            </div>
            <div className="text-xs font-mono tabular-nums whitespace-nowrap hidden sm:block">
              <span className="text-slate-400 mr-1">Personal</span>
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatCurrency(
                  gameState.finances.cashUSD + gameState.finances.bankBalanceUSD,
                  gameState.character.countryId,
                  true
                )}
              </strong>
            </div>
            {gameState.org.founded && (
              <div className="text-xs font-mono tabular-nums whitespace-nowrap hidden md:block">
                <span className="text-slate-400 mr-1">Org</span>
                <strong>
                  {formatCurrency(gameState.org.bankBalanceUSD, gameState.character.countryId, true)}
                </strong>
              </div>
            )}

            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle color theme"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                aria-label="Open save slots"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Save size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Feedback Toast */}
        {feedback && (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
            <div className="px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm">
              <span>{feedback}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white ml-3 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active View */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-10">
          {activeTab === 'home' && (
            <HomeView
              state={gameState}
              onNavigate={setActiveTab}
              onWorkShift={handleWorkShift}
              onBusinessResearch={handleBusinessResearch}
              onNetworking={handleNetworking}
              onAdvanceWeek={handleAdvanceWeek}
              onTriggerEnding={handleTriggerEnding}
            />
          )}
          {activeTab === 'career' && (
            <CareerView
              state={gameState}
              onApplyJob={handleApplyJob}
              onResignJob={handleResignJob}
              onWorkShift={handleWorkShift}
              onStudyProgram={handleStudyProgram}
              onTrainSkill={handleTrainSkill}
            />
          )}
          {activeTab === 'esports' && (
            <EsportsView
              state={gameState}
              onUpdateRegistrationField={(patch) =>
                commitState({
                  ...gameState,
                  registration: { ...gameState.registration, ...patch },
                })
              }
              onPayRegistrationStep={handlePayRegistrationStep}
              onSubmitOrgRegistration={handleSubmitOrgRegistration}
              onOpenDivision={handleOpenDivision}
              onTrainDivision={handleTrainDivision}
              onPrepDivision={handlePrepDivision}
              onToggleStarter={handleToggleStarter}
              onSetCaptain={handleSetCaptain}
              onRenewPlayer={handleRenewPlayer}
              onReleasePlayer={handleReleasePlayer}
              onScoutPlayer={handleScoutPlayer}
              onNegotiatePlayer={handleNegotiatePlayer}
              onEnterTournament={handleEnterTournament}
              onLaunchMatchModal={(trn) => setActiveMatchTournament(trn)}
            />
          )}
          {activeTab === 'business' && (
            <BusinessView
              state={gameState}
              onDepositToBank={handleDepositToBank}
              onWithdrawFromBank={handleWithdrawFromBank}
              onPayDebt={handlePayDebt}
              onSetLifestyle={handleSetLifestyle}
              onTransferPersonalToOrg={handleTransferPersonalToOrg}
              onUpgradeFacility={handleUpgradeFacility}
              onHireStaff={handleHireStaff}
              onFireStaff={handleFireStaff}
              onSignSponsor={handleSignSponsor}
              onLaunchMediaInitiative={handleLaunchMediaInitiative}
              onHireCreator={handleHireCreator}
              onBuyLifestyleAsset={handleBuyLifestyleAsset}
              onInvest={handleInvest}
              onSellInvestment={handleSellInvestment}
            />
          )}
          {activeTab === 'world' && <WorldView state={gameState} />}
          {activeTab === 'story' && (
            <StoryView
              state={gameState}
              onOpenEventModal={() => setShowEventModal(true)}
              onOpenSaveModal={() => setShowSaveModal(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (60px <= 15% cap combined with 52px header) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[60px] pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-6 items-center"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {showEventModal && gameState.pendingEvent && (
        <EventModal
          state={gameState}
          onChoose={handleResolveEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {activeMatchTournament && (
        <MatchModal
          state={gameState}
          tournament={activeMatchTournament}
          onSimulate={handleSimulateMatch}
          onClose={() => setActiveMatchTournament(null)}
        />
      )}

      {showSaveModal && (
        <SaveModal
          state={gameState}
          saves={saves}
          onSaveSlot={(slotId) => {
            saveGameToSlot(gameState, slotId);
            setSaves(listSaveSlots());
            setFeedback(`Saved career to ${slotId.replace('_', ' ')}.`);
          }}
          onLoadSlot={handleLoadSave}
          onNewCareer={() => setGameState(null)}
          onImportJson={(raw) => {
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.character && parsed?.finances) {
                commitState(parsed, 'Career imported successfully.');
              }
            } catch {
              setFeedback('Invalid career JSON format.');
            }
          }}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {gameState.ending && (
        <EndingModal
          ending={gameState.ending}
          onContinuePlaying={() => commitState({ ...gameState, ending: null })}
          onNewCareer={() => setGameState(null)}
        />
      )}
    </div>
  );
}
