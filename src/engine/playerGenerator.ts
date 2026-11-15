import { ESPORTS_TITLES, getGameById } from '../data/esportsTitles';
import { EsportsPlayer, GameState, PlayerAttributes, PlayerTier } from '../types/game';

const FIRST_IGN_PREFIXES = [
  'SHADOW', 'KAI', 'VEX', 'ZENO', 'APEX', 'PULSE', 'RYU', 'FENIX', 'LYNX', 'FROST',
  'MIRA', 'SORA', 'NOVA', 'VIPER', 'ORION', 'GHOST', 'CHRONO', 'BLITZ', 'VALK', 'TORN',
  'KROX', 'ECHO', 'SILVA', 'NEON', 'DRIFT', 'AXEL', 'SOLO', 'JINX', 'AERO', 'TITAN',
];

const REAL_FIRST_NAMES = [
  'Lucas', 'Min-jun', 'Liam', 'Mateo', 'Kenji', 'Noah', 'Kacper', 'Ethan', 'Gabriel', 'Daniel',
  'Hana', 'Sofia', 'Chloe', 'Aarav', 'Ji-hoon', 'Viktor', 'Oliver', 'Rafael', 'Soren', 'Maya',
];

const REAL_LAST_NAMES = [
  'Park', 'Silva', 'Miller', 'Kowalski', 'Tanaka', 'Kim', 'Schmidt', 'Chen', 'Andersson', 'Patel',
  'Lopez', 'Bennett', 'Nakamura', 'Ivanov', 'Moreau', 'Jensen', 'Reyes', 'Weber', 'Lee', 'Costa',
];

const NATIONALITIES = [
  'South Korea', 'United States', 'Poland', 'Brazil', 'Germany', 'United Kingdom',
  'Japan', 'Canada', 'Singapore', 'Sweden', 'India', 'France',
];

const ROLES_BY_GENRE: Record<string, string[]> = {
  'Tactical FPS': ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'In-Game Leader'],
  'Competitive FPS': ['Entry Fragger', 'AWPer', 'Lurker', 'Support', 'In-Game Leader'],
  MOBA: ['Top Lane', 'Jungle', 'Mid Lane', 'Bot Carry', 'Support'],
  'Battle Royale': ['Fragger', 'IGL', 'Support', 'Scout'],
  Sports: ['Striker', 'Midfield', 'Anchor'],
  'Hero Shooter': ['Tank', 'Hitscan DPS', 'Flex DPS', 'Main Support', 'Flex Support'],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function computeOverall(attrs: PlayerAttributes): number {
  const weighted =
    attrs.mechanicalSkill * 0.22 +
    attrs.gameSense * 0.18 +
    attrs.communication * 0.12 +
    attrs.consistency * 0.14 +
    attrs.experience * 0.1 +
    attrs.discipline * 0.08 +
    attrs.adaptability * 0.08 +
    attrs.mentalStrength * 0.08;
  return Math.round(weighted);
}

export function generatePlayer(
  gameId: string,
  tier: PlayerTier,
  indexHint = 0,
  countryBonusPotential = 0
): EsportsPlayer {
  const game = getGameById(gameId);
  const roles = ROLES_BY_GENRE[game.genre] ?? ['Flex'];

  const tierRanges: Record<PlayerTier, { min: number; max: number; salaryMin: number; salaryMax: number; expMin: number; expMax: number; repMin: number; repMax: number }> = {
    Amateur: { min: 45, max: 62, salaryMin: 350, salaryMax: 750, expMin: 15, expMax: 42, repMin: 5, repMax: 22 },
    'Semi-professional': { min: 58, max: 72, salaryMin: 900, salaryMax: 1850, expMin: 32, expMax: 58, repMin: 18, repMax: 40 },
    Professional: { min: 68, max: 80, salaryMin: 2200, salaryMax: 4400, expMin: 50, expMax: 74, repMin: 38, repMax: 62 },
    'Established professional': { min: 76, max: 87, salaryMin: 4800, salaryMax: 8500, expMin: 66, expMax: 86, repMin: 58, repMax: 78 },
    Superstar: { min: 85, max: 94, salaryMin: 9500, salaryMax: 18000, expMin: 76, expMax: 94, repMin: 76, repMax: 92 },
    'International legend': { min: 90, max: 98, salaryMin: 19000, salaryMax: 34000, expMin: 88, expMax: 99, repMin: 88, repMax: 99 },
  };

  const cfg = tierRanges[tier];
  const age = tier === 'Amateur' ? randInt(16, 20) : tier === 'International legend' ? randInt(22, 28) : randInt(18, 25);

  const attrs: PlayerAttributes = {
    mechanicalSkill: randInt(cfg.min, cfg.max),
    gameSense: randInt(cfg.min - 2, cfg.max),
    communication: randInt(cfg.min - 4, cfg.max),
    consistency: randInt(cfg.min - 3, cfg.max),
    experience: randInt(cfg.expMin, cfg.expMax),
    potential: Math.min(99, randInt(cfg.min + 3, Math.min(99, cfg.max + 8)) + countryBonusPotential),
    discipline: randInt(Math.max(40, cfg.min - 6), Math.min(98, cfg.max + 2)),
    adaptability: randInt(Math.max(42, cfg.min - 5), Math.min(98, cfg.max + 2)),
    mentalStrength: randInt(Math.max(40, cfg.min - 5), Math.min(98, cfg.max + 3)),
    reputation: randInt(cfg.repMin, cfg.repMax),
  };

  const overall = computeOverall(attrs);
  const monthlySalaryUSD = randInt(cfg.salaryMin, cfg.salaryMax);
  const suffix = Math.random() < 0.35 ? `${randInt(1, 99)}` : '';
  const ign = `${pick(FIRST_IGN_PREFIXES)}${suffix}`;

  return {
    id: `plr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${indexHint}`,
    ign,
    realName: `${pick(REAL_FIRST_NAMES)} ${pick(REAL_LAST_NAMES)}`,
    age,
    nationality: pick(NATIONALITIES),
    gameId,
    tier,
    role: roles[indexHint % roles.length],
    attributes: attrs,
    overall,
    monthlySalaryUSD,
    buyoutUSD: Math.round(monthlySalaryUSD * 3.5),
    contractWeeksLeft: randInt(24, 52),
    morale: randInt(72, 92),
    form: randInt(68, 90),
    isStarter: false,
    isCaptain: false,
    orgId: null,
    scouted: tier === 'Amateur' || tier === 'Semi-professional',
    trophies: tier === 'International legend' ? randInt(4, 11) : tier === 'Superstar' ? randInt(2, 6) : randInt(0, 2),
  };
}

export function generateInitialMarketPool(): EsportsPlayer[] {
  const pool: EsportsPlayer[] = [];
  ESPORTS_TITLES.forEach((game, gIdx) => {
    const tiers: PlayerTier[] = [
      'Amateur',
      'Amateur',
      'Semi-professional',
      'Semi-professional',
      'Professional',
      'Established professional',
      'Superstar',
      'International legend',
    ];
    tiers.forEach((tier, tIdx) => {
      pool.push(generatePlayer(game.id, tier, gIdx * 10 + tIdx));
    });
  });
  return pool;
}

/**
 * Evaluates whether a player will accept a contract offer based on Org Reputation,
 * Facilities, Salary Offer, and Player Tier.
 */
export function evaluateContractOffer(
  state: GameState,
  player: EsportsPlayer,
  offeredMonthlySalaryUSD: number
): { accepted: boolean; reason: string } {
  const minOrgRepByTier: Record<PlayerTier, number> = {
    Amateur: 0,
    'Semi-professional': 6,
    Professional: 18,
    'Established professional': 35,
    Superstar: 58,
    'International legend': 76,
  };

  const minFacilityByTier: Record<PlayerTier, number> = {
    Amateur: 1,
    'Semi-professional': 1,
    Professional: 3,
    'Established professional': 4,
    Superstar: 6,
    'International legend': 7,
  };

  const reqRep = minOrgRepByTier[player.tier];
  const reqFac = minFacilityByTier[player.tier];

  if (state.org.reputation + state.character.connections * 0.15 < reqRep) {
    return {
      accepted: false,
      reason: `${player.ign} (${player.tier}) declined: your organization needs higher industry reputation (${reqRep}+) before they commit.`,
    };
  }

  if (state.org.facilityLevel < reqFac) {
    return {
      accepted: false,
      reason: `${player.ign} declined: players of ${player.tier} caliber require Facility Level ${reqFac}+ training infrastructure.`,
    };
  }

  const salaryRatio = offeredMonthlySalaryUSD / Math.max(1, player.monthlySalaryUSD);
  const negBonus = state.character.skills.negotiation * 0.0025;
  const effectiveRatio = salaryRatio + negBonus;

  if (effectiveRatio < 0.85) {
    return {
      accepted: false,
      reason: `${player.ign} rejected the offer: salary is well below their ${player.monthlySalaryUSD.toLocaleString()} USD/mo expectation.`,
    };
  }

  if (effectiveRatio < 0.96 && Math.random() > 0.45) {
    return {
      accepted: false,
      reason: `${player.ign} passed on the deal after comparing competing offers. Try sweetening the monthly salary.`,
    };
  }

  return {
    accepted: true,
    reason: `${player.ign} signed the contract and officially joined ${state.org.name}!`,
  };
}
