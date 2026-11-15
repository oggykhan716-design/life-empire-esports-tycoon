import { getGameById } from '../data/esportsTitles';
import {
  ActiveTournament,
  EsportsPlayer,
  GameState,
  MatchReport,
  MatchStrategy,
  OrgDivision,
  RivalOrganization,
} from '../types/game';

export function computeTeamRating(
  starters: EsportsPlayer[],
  division: OrgDivision,
  state: GameState
): number {
  if (starters.length === 0) return 30;
  const avgOverall = starters.reduce((s, p) => s + p.overall, 0) / starters.length;
  const avgMorale = starters.reduce((s, p) => s + p.morale, 0) / starters.length;
  const avgForm = starters.reduce((s, p) => s + p.form, 0) / starters.length;

  const hasHeadCoach = state.org.staff.some((s) => s.roleId === 'head_coach');
  const hasAnalyst = state.org.staff.some((s) => s.roleId === 'analyst');
  const coachBoost = hasHeadCoach ? 3.5 : 0;
  const analystBoost = hasAnalyst ? 2.0 : 0;

  return (
    avgOverall * 0.68 +
    division.chemistry * 0.14 +
    division.tacticalPrep * 0.08 +
    avgMorale * 0.05 +
    avgForm * 0.05 +
    coachBoost +
    analystBoost
  );
}

export function estimateWinProbability(
  playerTeamRating: number,
  opponentStrength: number,
  strategy: MatchStrategy = 'balanced'
): number {
  const strategyDelta: Record<MatchStrategy, number> = {
    aggressive: 0.8,
    defensive: 0.4,
    target_weakest: 1.2,
    balanced: 0.6,
    coach_decide: 1.5,
  };
  const diff = playerTeamRating + strategyDelta[strategy] - opponentStrength;
  const raw = 50 + diff * 2.2;
  return Math.max(12, Math.min(92, Math.round(raw)));
}

export function simulateMatch(
  state: GameState,
  tournament: ActiveTournament,
  opponent: RivalOrganization | { name: string; strength: number; id: string },
  strategy: MatchStrategy
): { report: MatchReport; updatedState: GameState } {
  const game = getGameById(tournament.gameId);
  const division = state.org.divisions.find((d) => d.gameId === tournament.gameId)!;
  const starters = state.roster.filter((p) => p.gameId === tournament.gameId && p.isStarter);
  const mapName = game.maps[Math.floor(Math.random() * game.maps.length)];

  const teamRating = computeTeamRating(starters, division, state);
  const hasHeadCoach = state.org.staff.some((s) => s.roleId === 'head_coach');
  const coachExtra = strategy === 'coach_decide' && hasHeadCoach ? 3.5 : 0;
  const winProb = estimateWinProbability(teamRating + coachExtra, opponent.strength, strategy);

  // Underdogs can still upset! Variance widens with aggressive strategy.
  const variance = strategy === 'aggressive' ? 14 : strategy === 'defensive' ? 6 : 9;
  const roll = Math.random() * 100 + (Math.random() * variance * 2 - variance);
  const won = roll < winProb;

  // Scoreline generation
  const winningScore = game.genre === 'MOBA' ? 2 : game.genre === 'Sports' ? 4 : 13;
  const loserScore = won
    ? Math.max(game.genre === 'MOBA' ? 0 : 3, Math.round((100 - winProb) / 9 + Math.random() * 4))
    : Math.max(game.genre === 'MOBA' ? 0 : 4, Math.round((winProb) / 9 + Math.random() * 4));
  const clampedLoser = Math.min(winningScore - 1, loserScore);
  const scoreLine = won ? `${winningScore} – ${clampedLoser}` : `${clampedLoser} – ${winningScore}`;

  // Player match ratings
  const playerStats = starters.map((p) => {
    const perfRoll = (p.overall * 0.65 + p.form * 0.25 + Math.random() * 25) / 100;
    const baseRating = won ? 1.02 + perfRoll * 0.45 : 0.72 + perfRoll * 0.38;
    const rating = Number(baseRating.toFixed(2));
    const moraleDelta = won ? Math.floor(Math.random() * 4) + 2 : -(Math.floor(Math.random() * 4) + 1);
    return { ign: p.ign, rating, moraleDelta, id: p.id };
  });

  const sortedByRating = [...playerStats].sort((a, b) => b.rating - a.rating);
  const mvp = sortedByRating[0] ?? { ign: 'Team', rating: 1.1 };

  const tierRepBonus: Record<ActiveTournament['tier'], number> = {
    Local: 2,
    'Amateur League': 3,
    'Regional Championship': 5,
    'National Championship': 7,
    'International Qualifier': 9,
    'Major International': 13,
    'World Championship': 20,
  };

  const isFinalRound = tournament.round >= tournament.maxRounds;
  const matchPrizeUSD = won
    ? isFinalRound
      ? Math.round(tournament.prizePoolUSD * 0.55)
      : Math.round((tournament.prizePoolUSD * 0.12) / tournament.maxRounds)
    : Math.round((tournament.prizePoolUSD * 0.03) / tournament.maxRounds);

  const repDelta = won ? tierRepBonus[tournament.tier] : -1;
  const rankPointsDelta = won
    ? Math.round(18 + tierRepBonus[tournament.tier] * 4)
    : -Math.round(8 + tierRepBonus[tournament.tier]);

  const strategyTextMap: Record<MatchStrategy, string> = {
    aggressive: 'Aggressive high-tempo executions',
    defensive: 'Disciplined defensive holds',
    target_weakest: 'Targeted pressure against the opponent weak link',
    balanced: 'Balanced mid-round adaptation',
    coach_decide: 'Coach-called tactical gameplan',
  };

  const narrative: string[] = [
    `Opening phase on ${mapName}: ${state.org.name} deployed ${strategyTextMap[strategy].toLowerCase()}.`,
    won
      ? `${mvp.ign} took over the server with a ${mvp.rating} rating, swinging critical late rounds in ${state.org.name}'s favor.`
      : `${opponent.name} punished key rotations down the stretch despite ${mvp.ign}'s ${mvp.rating} rating effort.`,
    won && isFinalRound
      ? `CHAMPIONS: ${state.org.name} defeated ${opponent.name} (${scoreLine}) to capture the ${tournament.name} trophy!`
      : won
      ? `Victory secured (${scoreLine}). Advancing deeper in the ${tournament.name} bracket.`
      : `Match concluded (${scoreLine}) in favor of ${opponent.name}.`,
  ];

  const report: MatchReport = {
    id: `match_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    week: state.week,
    tournamentName: tournament.name,
    tournamentTier: tournament.tier,
    gameId: tournament.gameId,
    mapName,
    opponentName: opponent.name,
    winProbability: winProb,
    strategyUsed: strategy,
    won,
    scoreLine,
    mvpIgn: mvp.ign,
    mvpRating: mvp.rating,
    prizeWonUSD: matchPrizeUSD,
    reputationDelta: repDelta,
    rankPointsDelta,
    narrative,
    playerStats: playerStats.map(({ ign, rating, moraleDelta }) => ({ ign, rating, moraleDelta })),
  };

  // Update state
  const updatedRoster = state.roster.map((p) => {
    const stat = playerStats.find((s) => s.id === p.id);
    if (!stat) return p;
    return {
      ...p,
      morale: Math.max(15, Math.min(100, p.morale + stat.moraleDelta)),
      form: Math.max(30, Math.min(100, p.form + (won ? 3 : -2))),
      attributes: {
        ...p.attributes,
        experience: Math.min(99, p.attributes.experience + 1),
      },
      trophies: won && isFinalRound ? p.trophies + 1 : p.trophies,
    };
  });

  const updatedDivisions = state.org.divisions.map((d) => {
    if (d.gameId !== tournament.gameId) return d;
    const newPoints = Math.max(0, d.rankingPoints + rankPointsDelta);
    return {
      ...d,
      rankingPoints: newPoints,
      worldRank: Math.max(1, Math.round(120 - newPoints / 12)),
      wins: d.wins + (won ? 1 : 0),
      losses: d.losses + (won ? 0 : 1),
      titlesWon: d.titlesWon + (won && isFinalRound ? 1 : 0),
      chemistry: Math.max(20, Math.min(100, d.chemistry + (won ? 2 : -1))),
    };
  });

  const updatedTrophies =
    won && isFinalRound
      ? [
          ...state.org.trophies,
          {
            tournamentName: tournament.name,
            gameId: tournament.gameId,
            tier: tournament.tier,
            week: state.week,
            prizeUSD: matchPrizeUSD,
          },
        ]
      : state.org.trophies;

  const updatedTournaments = state.tournaments.map((t) => {
    if (t.id !== tournament.id) return t;
    if (!won) {
      return {
        ...t,
        status: 'Completed' as const,
        playerEliminated: true,
        winnerName: opponent.name,
      };
    }
    if (isFinalRound) {
      return {
        ...t,
        status: 'Completed' as const,
        winnerName: state.org.name,
      };
    }
    return {
      ...t,
      round: t.round + 1,
      status: 'In Progress' as const,
    };
  });

  // Check tournament-specific sponsor win bonuses
  const sponsorBonus = won
    ? state.org.sponsors.reduce((sum, sp) => sum + sp.winBonusUSD, 0)
    : 0;

  const followerGain = won
    ? Math.round((isFinalRound ? 6500 : 1400) * (1 + tierRepBonus[tournament.tier] * 0.15))
    : 200;

  const updatedState: GameState = {
    ...state,
    roster: updatedRoster,
    tournaments: updatedTournaments,
    recentMatches: [report, ...state.recentMatches].slice(0, 20),
    org: {
      ...state.org,
      bankBalanceUSD: state.org.bankBalanceUSD + matchPrizeUSD + sponsorBonus,
      reputation: Math.max(0, Math.min(100, state.org.reputation + repDelta)),
      followers: state.org.followers + followerGain,
      divisions: updatedDivisions,
      trophies: updatedTrophies,
    },
    history: [
      {
        id: `log_${Date.now()}`,
        week: state.week,
        year: state.year,
        category: 'Esports' as const,
        title: won && isFinalRound ? `Won ${tournament.name}` : `${tournament.name} Match`,
        summary: `${state.org.name} ${won ? 'defeated' : 'fell to'} ${opponent.name} (${scoreLine}) on ${mapName}. MVP: ${mvp.ign}.`,
      },
      ...state.history,
    ].slice(0, 80),
  };

  return { report, updatedState };
}
