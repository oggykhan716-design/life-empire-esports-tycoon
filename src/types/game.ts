import { CareerType, PlayerCareerState } from './career';
import { BankAccount, BankTransaction, StockMarket } from './finance';
import { ConversationMeta, Message, PhoneAppId, PhoneNotification } from './phone';
import {
  BrandCollabOffer,
  InstagramAccount,
  NewsArticle,
  SocialPost,
  Tweet,
  TwitterAccount,
  YouTubeChannel,
  YouTubeVideo,
} from './social';
import { WorldEvent } from '../engine/events/types';

export type NavTab = 'home' | 'career' | 'esports' | 'business' | 'world' | 'story';

export type Gender = 'Male' | 'Female' | 'Non-binary';
export type PersonalityType = 'Analytical' | 'Charismatic' | 'Relentless' | 'Pragmatic' | 'Visionary';
export type FamilyBackground = 'Working Class' | 'Single-Parent Household' | 'Rural Laborers' | 'Immigrant Hustle';
export type EducationLevel = 'High School' | 'Vocational Certificate' | 'Associate Degree' | 'Bachelor of Business' | 'MBA';
export type LifestyleTier = 'basic' | 'expensive';

export interface CountryEconomy {
  id: string;
  name: string;
  region: 'North America' | 'Europe' | 'East Asia' | 'South America' | 'Southeast Asia' | 'South Asia';
  currencyCode: string;
  currencySymbol: string;
  /** Units of local currency per 1 USD */
  exchangeRate: number;
  /** Multiplier to base USD wages (e.g. 1.0 in US, 0.72 in Poland, 0.25 in India) */
  wageMultiplier: number;
  /** Multiplier to living costs */
  livingCostMultiplier: number;
  /** Multiplier to org registration & license fees */
  licenseCostMultiplier: number;
  /** Esports ecosystem maturity 1-100 */
  esportsEcosystem: number;
  taxRate: number;
  cities: string[];
  description: string;
  localBonus: string;
}

export interface CharacterSkills {
  workEthic: number;
  businessAcumen: number;
  esportsKnowledge: number;
  negotiation: number;
  leadership: number;
  marketing: number;
}

export interface CharacterProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  countryId: string;
  city: string;
  education: EducationLevel;
  personality: PersonalityType;
  familyBackground: FamilyBackground;
  skills: CharacterSkills;
  reputation: number;
  connections: number;
  health: number;
  stress: number;
}

export type JobPositionLevel = 1 | 2 | 3 | 4 | 5;

export interface JobDefinition {
  id: string;
  title: string;
  category: 'Service' | 'Logistics' | 'Office' | 'Remote';
  baseWeeklyIncomeUSD: number;
  energyCost: number;
  maxShiftsPerWeek: number;
  requiredEducation: EducationLevel;
  minConnections: number;
  description: string;
}

export interface EmploymentState {
  currentJobId: string | null;
  level: JobPositionLevel;
  weeksInRole: number;
  consistencyStreak: number;
  shiftsWorkedThisWeek: number;
}

export type InvestmentCategory = 'Stocks' | 'Cryptocurrency' | 'Real Estate' | 'Private Business';

export interface InvestmentHolding {
  id: string;
  name: string;
  category: InvestmentCategory;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  investedUSD: number;
  currentValueUSD: number;
  weeklyYieldRate: number;
  volatility: number;
}

export interface LifestyleItemDefinition {
  id: string;
  name: string;
  category: 'Property' | 'Vehicle' | 'Luxury';
  priceUSD: number;
  weeklyUpkeepUSD: number;
  reputationBonus: number;
  connectionsBonus: number;
  description: string;
}

export interface PersonalFinances {
  cashUSD: number;
  bankBalanceUSD: number;
  debtUSD: number;
  lifestyle: LifestyleTier;
  ownedAssetIds: string[];
  investments: InvestmentHolding[];
  lastWeekIncomeUSD: number;
  lastWeekExpensesUSD: number;
  lifetimeEarnedUSD: number;
}

export interface EsportsGameTitle {
  id: string;
  name: string;
  genre: 'Tactical FPS' | 'Competitive FPS' | 'Battle Royale' | 'MOBA' | 'Sports' | 'Hero Shooter';
  rosterSize: number;
  maps: string[];
  globalPopularity: number;
  basePrizeScale: number;
  description: string;
}

export type PlayerTier =
  | 'Amateur'
  | 'Semi-professional'
  | 'Professional'
  | 'Established professional'
  | 'Superstar'
  | 'International legend';

export interface PlayerAttributes {
  mechanicalSkill: number;
  gameSense: number;
  communication: number;
  consistency: number;
  experience: number;
  potential: number;
  discipline: number;
  adaptability: number;
  mentalStrength: number;
  reputation: number;
}

export interface EsportsPlayer {
  id: string;
  ign: string;
  realName: string;
  age: number;
  nationality: string;
  gameId: string;
  tier: PlayerTier;
  role: string;
  attributes: PlayerAttributes;
  overall: number;
  monthlySalaryUSD: number;
  buyoutUSD: number;
  contractWeeksLeft: number;
  morale: number;
  form: number;
  isStarter: boolean;
  isCaptain: boolean;
  orgId: string | null;
  scouted: boolean;
  trophies: number;
  popularity?: number;
  isFictionalLegend?: boolean;
}

export interface FacilityTier {
  id: string;
  name: string;
  level: number;
  costUSD: number;
  weeklyMaintenanceUSD: number;
  constructionWeeks: number;
  maxDivisions: number;
  trainingBonus: number;
  attractionBonus: number;
  reputationBonus: number;
  description: string;
}

export type StaffRoleId =
  | 'general_manager'
  | 'team_manager'
  | 'head_coach'
  | 'assistant_coach'
  | 'analyst'
  | 'scout'
  | 'marketing_director'
  | 'social_media_manager'
  | 'financial_manager'
  | 'content_director';

export interface StaffRoleDefinition {
  id: StaffRoleId;
  title: string;
  department: 'Executive' | 'Coaching' | 'Operations' | 'Media';
  baseWeeklySalaryUSD: number;
  energyReductionTask: string;
  perkSummary: string;
}

export interface HiredStaff {
  id: string;
  roleId: StaffRoleId;
  name: string;
  skill: number;
  experience: number;
  weeklySalaryUSD: number;
}

export interface SponsorDeal {
  id: string;
  brandName: string;
  industry: string;
  type: 'Short-term' | 'Annual' | 'Tournament Bonus';
  weeklyPayoutUSD: number;
  signingBonusUSD: number;
  weeksRemaining: number;
  minReputation: number;
  winBonusUSD: number;
  penaltyUSD: number;
}

export interface ContentCreator {
  id: string;
  handle: string;
  specialty: 'Streamer' | 'YouTube Producer' | 'Podcast Host' | 'Documentary Lead';
  followers: number;
  quality: number;
  weeklySalaryUSD: number;
  weeklyRevenueUSD: number;
}

export interface OrgDivision {
  gameId: string;
  chemistry: number;
  tacticalPrep: number;
  rankingPoints: number;
  worldRank: number;
  wins: number;
  losses: number;
  titlesWon: number;
  trainedThisWeek: boolean;
}

export interface OrgRegistrationProgress {
  businessRegistered: boolean;
  licenseAcquired: boolean;
  legalDocsDone: boolean;
  brandingDone: boolean;
  marketingLaunchDone: boolean;
  initialReserveDeposited: boolean;
  approvalWeeksRemaining: number;
  proposedName: string;
  proposedTag: string;
  proposedColor: string;
  proposedIcon: string;
}

export type OrgType =
  | 'Standard'
  | 'Academy-Focused'
  | 'Media & Content'
  | 'Global Franchise'
  | 'Championship Contender';

export type OrgStrategy =
  | 'Balanced'
  | 'Talent Development'
  | 'Hyper-Aggressive'
  | 'Commercial Empire'
  | 'International Expansion';

export interface PaperTeamEntry {
  id: string;
  name: string;
  gameId: string;
  createdWeek: number;
  active: boolean;
}

export interface DevOverrides {
  unlockAllFeatures?: boolean;
  unlockAllFacilities?: boolean;
  unlockAllTournaments?: boolean;
  instantUpgrades?: boolean;
  customMonthlyRevenueUSD?: number | null;
  customMonthlyExpensesUSD?: number | null;
}

export interface PlayerOrganization {
  founded: boolean;
  name: string;
  tag: string;
  color: string;
  icon: string;
  headquarters: string;
  foundedWeek: number;
  bankBalanceUSD: number;
  valuationUSD: number;
  reputation: number;
  followers: number;
  facilityLevel: number;
  equipmentUpgradeLevel: number;
  facilityUnderConstruction: {
    targetLevel: number;
    weeksRemaining: number;
  } | null;
  divisions: OrgDivision[];
  staff: HiredStaff[];
  sponsors: SponsorDeal[];
  creators: ContentCreator[];
  youtubeLaunched: boolean;
  merchBrandLaunched: boolean;
  podcastLaunched: boolean;
  lastWeekRevenueUSD: number;
  lastWeekExpensesUSD: number;
  trophies: {
    tournamentName: string;
    gameId: string;
    tier: TournamentTier;
    week: number;
    prizeUSD: number;
  }[];
  orgType?: OrgType;
  orgStrategy?: OrgStrategy;
  orgXp?: number;
  paperTeamUnlocked?: boolean;
  paperTeams?: PaperTeamEntry[];
  internationalExpansionUnlocked?: boolean;
  bonusRosterSlots?: number;
}

export type TournamentTier =
  | 'Local'
  | 'Amateur League'
  | 'Regional Championship'
  | 'National Championship'
  | 'International Qualifier'
  | 'Major International'
  | 'World Championship';

export interface ActiveTournament {
  id: string;
  name: string;
  gameId: string;
  tier: TournamentTier;
  prizePoolUSD: number;
  entryFeeUSD: number;
  minRankPoints: number;
  round: number;
  maxRounds: number;
  status: 'Open' | 'In Progress' | 'Completed';
  participants: string[];
  playerEliminated: boolean;
  currentOpponentId: string | null;
  winnerName: string | null;
}

export interface RivalOrganization {
  id: string;
  name: string;
  tag: string;
  color: string;
  identity: string;
  region: string;
  valuationUSD: number;
  bankBalanceUSD: number;
  reputation: number;
  fanbase: number;
  strength: number;
  activeGameIds: string[];
  trophies: number;
  status: 'Active' | 'Declining' | 'Bankrupt' | 'Acquired';
  recentTrend: 'Rising' | 'Steady' | 'Slumping';
}

export type MatchStrategy =
  | 'aggressive'
  | 'defensive'
  | 'target_weakest'
  | 'balanced'
  | 'coach_decide';

export interface MatchReport {
  id: string;
  week: number;
  tournamentName: string;
  tournamentTier: TournamentTier;
  gameId: string;
  mapName: string;
  opponentName: string;
  winProbability: number;
  strategyUsed: MatchStrategy;
  won: boolean;
  scoreLine: string;
  mvpIgn: string;
  mvpRating: number;
  prizeWonUSD: number;
  reputationDelta: number;
  rankPointsDelta: number;
  narrative: string[];
  playerStats: {
    ign: string;
    rating: number;
    moraleDelta: number;
  }[];
}

export interface EventChoice {
  id: string;
  label: string;
  hint: string;
  requiresCashUSD?: number;
  requiresOrgBalanceUSD?: number;
  effectDescription: string;
  apply: (state: GameState) => { updated: GameState; outcomeText: string };
}

export interface ActiveStoryEvent {
  id: string;
  title: string;
  category: 'Early Life' | 'Organization' | 'Competitive' | 'World' | 'Milestone';
  description: string;
  choices: {
    id: string;
    label: string;
    detail: string;
    costCashUSD?: number;
    costOrgUSD?: number;
  }[];
}

export interface HistoricalLogEntry {
  id: string;
  week: number;
  year: number;
  category: 'Life' | 'Career' | 'Esports' | 'Finance' | 'World' | 'Story';
  title: string;
  summary: string;
}

export interface WeeklyRecap {
  week: number;
  year: number;
  personalIncomeUSD: number;
  personalExpensesUSD: number;
  orgRevenueUSD: number;
  orgExpensesUSD: number;
  highlights: string[];
}

export interface EndingSummary {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  achievedWeek: number;
}

export interface PhoneState {
  activeApp: PhoneAppId | null;
  notifications: PhoneNotification[];
  conversations: ConversationMeta[];
  messages: Message[];
  news: NewsArticle[];
  twitterAccounts: TwitterAccount[];
  tweets: Tweet[];
  trendingTopics: { tag: string; postsCount: number; summary: string }[];
  instagramAccount: InstagramAccount;
  instagramPosts: SocialPost[];
  brandCollabOffers: BrandCollabOffer[];
  youtubeChannels: YouTubeChannel[];
  youtubeVideos: YouTubeVideo[];
  bankAccounts: BankAccount[];
  transactions: BankTransaction[];
  stockMarket: StockMarket;
}

export interface GameState {
  version: string;
  schemaVersion?: number;
  saveSlotId: string;
  careerType?: CareerType;
  randomSeed?: number;
  week: number;
  year: number;
  energy: number;
  maxEnergy: number;
  character: CharacterProfile;
  employment: EmploymentState;
  finances: PersonalFinances;
  registration: OrgRegistrationProgress;
  org: PlayerOrganization;
  playerCareer?: PlayerCareerState;
  roster: EsportsPlayer[];
  marketPlayers: EsportsPlayer[];
  rivals: RivalOrganization[];
  tournaments: ActiveTournament[];
  recentMatches: MatchReport[];
  pendingEvent: ActiveStoryEvent | null;
  lastWeeklyRecap: WeeklyRecap | null;
  history: HistoricalLogEntry[];
  worldNews: { id: string; week: number; headline: string; body: string }[];
  unlockedAchievements: string[];
  ending: EndingSummary | null;
  activitiesThisWeek: string[];
  day?: number;
  isSandbox?: boolean;
  devOverrides?: DevOverrides;
  phoneState?: PhoneState;
  eventHistory?: WorldEvent[];
  processedEventIds?: string[];
}
