export type BankAccountScope = 'PERSONAL' | 'ORGANISATION';

export interface BankAccount {
  id: string;
  scope: BankAccountScope;
  label: string;
  ownerName: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  amount: number;
  description: string;
  timestamp: number;
  gameWeek: number;
  relatedEventId?: string;
}

export interface StockPricePoint {
  week: number;
  day: number;
  price: number;
}

export interface StockListing {
  ticker: string;
  orgId: string;
  orgName: string;
  color: string;
  isPlayerOrg?: boolean;
  sharePrice: number;
  previousPrice: number;
  totalShares: number;
  availableShares: number;
  dailyChangePct: number;
  financialHealth: number; // 0..100
  publicReputation: number; // 0..100
  history: StockPricePoint[];
  processedEventIds: string[];
}

export interface StockHolding {
  ticker: string;
  orgId: string;
  shares: number;
  avgCostUSD: number;
}

export interface StockMarket {
  listings: StockListing[];
  portfolio: StockHolding[];
  lastUpdatedWeek: number;
  lastUpdatedDay: number;
}
