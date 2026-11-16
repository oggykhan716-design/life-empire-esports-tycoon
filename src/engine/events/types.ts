export type WorldEventType =
  // Competitive Events
  | 'MATCH_STARTED'
  | 'MATCH_COMPLETED'
  | 'TOURNAMENT_STARTED'
  | 'TOURNAMENT_COMPLETED'
  | 'TEAM_QUALIFIED'
  | 'TEAM_ELIMINATED'
  | 'PLAYER_PERFORMANCE_RECORDED'
  // Organisation Events
  | 'ORGANISATION_CREATED'
  | 'PLAYER_SIGNED'
  | 'PLAYER_RELEASED'
  | 'PLAYER_TRANSFERRED'
  | 'COACH_HIRED'
  | 'SPONSORSHIP_SIGNED'
  | 'ORGANISATION_BANKRUPTCY'
  // Player Events
  | 'PLAYER_PROMOTED'
  | 'PLAYER_BENCHED'
  | 'PLAYER_CONTRACT_EXPIRED'
  | 'PLAYER_REPUTATION_CHANGED'
  | 'PLAYER_RETIREMENT'
  // Community Events
  | 'ORGANISATION_TRENDING'
  | 'PLAYER_TRENDING'
  | 'CONTROVERSY_CREATED'
  | 'RIVALRY_INTENSIFIED'
  | 'SOCIAL_POST_PUBLISHED'
  // Economic Events
  | 'SALARY_PAID'
  | 'SPONSORSHIP_PAYMENT_RECEIVED'
  | 'TOURNAMENT_PRIZE_RECEIVED'
  | 'STOCK_PRICE_UPDATED'
  | 'VIDEO_REVENUE_RECEIVED';

export type EventImportance = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  timestamp: number;
  gameWeek: number;
  gameDay: number;

  actorId?: string;
  targetId?: string;

  title: string;
  description: string;

  payload: Record<string, unknown>;

  importance: EventImportance;
}

/** Deterministic PRNG helper (Mulberry32) */
export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
