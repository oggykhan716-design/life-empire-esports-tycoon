import { ESPORTS_TITLES, getGameById } from '../data/esportsTitles';
import { ActiveTournament, RivalOrganization, TournamentTier } from '../types/game';

interface TierConfig {
  tier: TournamentTier;
  basePrizeUSD: number;
  entryFeeUSD: number;
  minRankPoints: number;
  maxRounds: number;
  strengthRange: [number, number];
}

export const TOURNAMENT_TIER_CONFIGS: TierConfig[] = [
  {
    tier: 'Local',
    basePrizeUSD: 2500,
    entryFeeUSD: 150,
    minRankPoints: 0,
    maxRounds: 2,
    strengthRange: [48, 60],
  },
  {
    tier: 'Amateur League',
    basePrizeUSD: 6500,
    entryFeeUSD: 400,
    minRankPoints: 20,
    maxRounds: 3,
    strengthRange: [56, 68],
  },
  {
    tier: 'Regional Championship',
    basePrizeUSD: 22000,
    entryFeeUSD: 1200,
    minRankPoints: 60,
    maxRounds: 3,
    strengthRange: [65, 77],
  },
  {
    tier: 'National Championship',
    basePrizeUSD: 60000,
    entryFeeUSD: 2500,
    minRankPoints: 140,
    maxRounds: 4,
    strengthRange: [73, 83],
  },
  {
    tier: 'International Qualifier',
    basePrizeUSD: 110000,
    entryFeeUSD: 4500,
    minRankPoints: 240,
    maxRounds: 3,
    strengthRange: [79, 88],
  },
  {
    tier: 'Major International',
    basePrizeUSD: 350000,
    entryFeeUSD: 8500,
    minRankPoints: 380,
    maxRounds: 4,
    strengthRange: [84, 92],
  },
  {
    tier: 'World Championship',
    basePrizeUSD: 1500000,
    entryFeeUSD: 15000,
    minRankPoints: 550,
    maxRounds: 5,
    strengthRange: [88, 96],
  },
];

const TOURNAMENT_SERIES_NAMES: Record<TournamentTier, string[]> = {
  Local: ['City Open Cup', 'Metro LAN Clash', 'District Gauntlet'],
  'Amateur League': ['Challenger Circuit', 'Contenders Series', 'Rising Stars Cup'],
  'Regional Championship': ['Regional Split Finals', 'Continental Cup', 'Premier Regional'],
  'National Championship': ['National Masters', 'Federation Championship', 'National Crown'],
  'International Qualifier': ['Global Play-In', 'World Circuit Qualifier', 'Cross-Region Clash'],
  'Major International': ['Apex Masters Stockholm', 'Pacific Grand Major', 'Atlantic Invites'],
  'World Championship': ['Annual World Championship'],
};

export function generateTournamentsForGame(gameId: string, week: number, rivals: RivalOrganization[]): ActiveTournament[] {
  const game = getGameById(gameId);
  const activeRivals = rivals.filter((r) => r.status === 'Active' || r.status === 'Declining');

  return TOURNAMENT_TIER_CONFIGS.map((cfg, idx) => {
    const names = TOURNAMENT_SERIES_NAMES[cfg.tier];
    const baseName = names[(week + idx) % names.length];
    const prizePoolUSD = Math.round(cfg.basePrizeUSD * game.basePrizeScale);

    return {
      id: `trn_${gameId}_${cfg.tier.replace(/\s+/g, '_').toLowerCase()}_${week}`,
      name: `${game.name}: ${baseName}`,
      gameId,
      tier: cfg.tier,
      prizePoolUSD,
      entryFeeUSD: cfg.entryFeeUSD,
      minRankPoints: cfg.minRankPoints,
      round: 1,
      maxRounds: cfg.maxRounds,
      status: 'Open',
      participants: activeRivals.slice(0, 6).map((r) => r.id),
      playerEliminated: false,
      currentOpponentId: null,
      winnerName: null,
    };
  });
}

export function generateInitialTournaments(rivals: RivalOrganization[]): ActiveTournament[] {
  const list: ActiveTournament[] = [];
  ESPORTS_TITLES.forEach((game) => {
    list.push(...generateTournamentsForGame(game.id, 1, rivals));
  });
  return list;
}

export function pickOpponentForMatch(
  tournament: ActiveTournament,
  rivals: RivalOrganization[]
): { id: string; name: string; strength: number } {
  const cfg = TOURNAMENT_TIER_CONFIGS.find((c) => c.tier === tournament.tier) ?? TOURNAMENT_TIER_CONFIGS[0];
  const [minStr, maxStr] = cfg.strengthRange;

  if (
    tournament.tier === 'Regional Championship' ||
    tournament.tier === 'National Championship' ||
    tournament.tier === 'International Qualifier' ||
    tournament.tier === 'Major International' ||
    tournament.tier === 'World Championship'
  ) {
    const eligible = rivals.filter(
      (r) =>
        (r.status === 'Active' || r.status === 'Declining') &&
        r.strength >= minStr - 5
    );
    if (eligible.length > 0) {
      const picked = eligible[Math.floor(Math.random() * eligible.length)];
      const roundBump = (tournament.round - 1) * 1.5;
      return {
        id: picked.id,
        name: picked.name,
        strength: Math.min(97, Math.round(picked.strength + roundBump)),
      };
    }
  }

  // Local / Amateur regional squads
  const amateurNames = [
    'Subzero Five',
    'Metro Sparks',
    'Ironclad Academy',
    'Neon Strikers',
    'Harbor Five',
    'Horizon Youth',
    'Silverline Gaming',
    'Kinetic Squad',
  ];
  const name = amateurNames[Math.floor(Math.random() * amateurNames.length)];
  const strength = Math.round(minStr + Math.random() * (maxStr - minStr) + (tournament.round - 1) * 2);
  return { id: `npc_${name}`, name, strength };
}
