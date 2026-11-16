export type CareerType = 'OWNER' | 'PLAYER';

export type PlayerCareerRank =
  | 'Amateur'
  | 'Semi-Pro'
  | 'Professional'
  | 'Established Professional'
  | 'Superstar'
  | 'Legend';

export type PlayerStartingBackground =
  | 'Ranked Prodigy'
  | 'LAN Grinder'
  | 'College Captain'
  | 'Academy Hopeful';

export interface PlayerCareerAttributes {
  skill: number;
  consistency: number;
  experience: number;
  reputation: number;
  popularity: number;
  potential: number;
  teamwork: number;
  pressure: number;
}

export interface TryoutInvite {
  id: string;
  orgId: string;
  orgName: string;
  orgTag: string;
  orgReputation: number;
  gameId: string;
  role: string;
  offeredSalaryUSD: number;
  contractWeeks: number;
  isStarterGuaranteed: boolean;
  expiresWeek: number;
  status: 'pending' | 'accepted' | 'rejected' | 'passed' | 'failed';
}

export interface ContractOffer {
  id: string;
  orgId: string;
  orgName: string;
  orgTag: string;
  gameId: string;
  role: string;
  monthlySalaryUSD: number;
  durationWeeks: number;
  winBonusUSD: number;
  tournamentBonusPct: number;
  signingBonusUSD: number;
  isStarter: boolean;
  transferClauseUSD: number;
  sponsorAllowanceUSD: number;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiated';
}

export interface PlayerCareerState {
  ign: string;
  nationality: string;
  primaryGameId: string;
  preferredRole: string;
  startingBackground: PlayerStartingBackground;
  rank: PlayerCareerRank;
  attributes: PlayerCareerAttributes;
  currentOrgId: string | null;
  currentOrgName: string | null;
  currentOrgTag: string | null;
  isStarter: boolean;
  isCaptain: boolean;
  monthlySalaryUSD: number;
  contractWeeksLeft: number;
  winBonusUSD: number;
  tournamentBonusPct: number;
  matchesPlayed: number;
  matchesWon: number;
  mvpCount: number;
  trophiesWon: number;
  avgRating: number;
  trainedThisWeek: boolean;
  scrimmedThisWeek: boolean;
  tryouts: TryoutInvite[];
  contractOffers: ContractOffer[];
  retired: boolean;
  retiredWeek?: number;
  transferRequested: boolean;
  personalSponsors: {
    id: string;
    brandName: string;
    weeklyPayoutUSD: number;
    weeksRemaining: number;
  }[];
}
