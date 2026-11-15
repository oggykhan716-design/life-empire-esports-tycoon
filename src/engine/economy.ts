import { getCountryById } from '../data/countries';
import { LIFESTYLE_ITEMS } from '../data/lifestyleAndInvestments';
import { GameState } from '../types/game';

/**
 * Formats a USD base amount into the player's local country currency.
 * Keeps game math consistent in USD internally while showing authentic local currency everywhere!
 */
export function formatCurrency(usdAmount: number, countryId: string, compact = false): string {
  const country = getCountryById(countryId);
  const localValue = usdAmount * country.exchangeRate;
  const abs = Math.abs(localValue);
  const sign = localValue < 0 ? '-' : '';

  if (compact) {
    if (abs >= 1_000_000_000) {
      return `${sign}${country.currencySymbol}${(abs / 1_000_000_000).toFixed(2)}B`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${country.currencySymbol}${(abs / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 10_000) {
      return `${sign}${country.currencySymbol}${(abs / 1_000).toFixed(1)}K`;
    }
  }

  const maxFractionDigits = country.exchangeRate >= 50 ? 0 : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(Math.round(abs));

  return `${sign}${country.currencySymbol}${formatted}`;
}

export function calculateWeeklyPersonalExpensesUSD(state: GameState): {
  total: number;
  breakdown: { label: string; amountUSD: number }[];
} {
  const country = getCountryById(state.character.countryId);
  const mult = country.livingCostMultiplier;
  const isExpensive = state.finances.lifestyle === 'expensive';

  const ownsProperty = state.finances.ownedAssetIds.some((id) => {
    const item = LIFESTYLE_ITEMS.find((i) => i.id === id);
    return item?.category === 'Property';
  });
  const ownsVehicle = state.finances.ownedAssetIds.some((id) => {
    const item = LIFESTYLE_ITEMS.find((i) => i.id === id);
    return item?.category === 'Vehicle';
  });

  const rent = ownsProperty ? 0 : Math.round((isExpensive ? 240 : 85) * mult);
  const food = Math.round((isExpensive ? 140 : 48) * mult);
  const transport = ownsVehicle ? Math.round(14 * mult) : Math.round((isExpensive ? 65 : 22) * mult);
  const utilities = Math.round((isExpensive ? 55 : 24) * mult);
  const healthcare = Math.round((isExpensive ? 45 : 14) * mult);
  const entertainment = Math.round((isExpensive ? 95 : 12) * mult);

  const assetUpkeep = state.finances.ownedAssetIds.reduce((sum, id) => {
    const item = LIFESTYLE_ITEMS.find((i) => i.id === id);
    return sum + (item?.weeklyUpkeepUSD ?? 0);
  }, 0);

  const debtInterest = state.finances.debtUSD > 0 ? Math.max(5, Math.round(state.finances.debtUSD * 0.03)) : 0;

  const breakdown = [
    { label: ownsProperty ? 'Rent (Waived — Property Owner)' : 'Rent & Housing', amountUSD: rent },
    { label: 'Food & Groceries', amountUSD: food },
    { label: 'Transportation', amountUSD: transport },
    { label: 'Utilities & Internet', amountUSD: utilities },
    { label: 'Healthcare', amountUSD: healthcare },
    { label: 'Entertainment', amountUSD: entertainment },
  ];

  if (assetUpkeep > 0) {
    breakdown.push({ label: 'Property & Vehicle Upkeep', amountUSD: assetUpkeep });
  }
  if (debtInterest > 0) {
    breakdown.push({ label: 'Debt Interest (3%/wk)', amountUSD: debtInterest });
  }

  const total = breakdown.reduce((acc, row) => acc + row.amountUSD, 0);
  return { total, breakdown };
}

export function calculatePersonalNetWorthUSD(state: GameState): number {
  const investmentTotal = state.finances.investments.reduce((sum, inv) => sum + inv.currentValueUSD, 0);
  const assetResaleTotal = state.finances.ownedAssetIds.reduce((sum, id) => {
    const item = LIFESTYLE_ITEMS.find((i) => i.id === id);
    return sum + Math.round((item?.priceUSD ?? 0) * 0.8);
  }, 0);
  return (
    state.finances.cashUSD +
    state.finances.bankBalanceUSD +
    investmentTotal +
    assetResaleTotal -
    state.finances.debtUSD
  );
}

export function calculateOrgValuationUSD(state: GameState): number {
  if (!state.org.founded) return 0;
  const rosterValue = state.roster.reduce((sum, p) => sum + p.buyoutUSD, 0);
  const trophyBonus = state.org.trophies.reduce((sum, t) => sum + Math.max(5000, t.prizeUSD * 0.5), 0);
  const followerValue = state.org.followers * 1.4;
  const repMultiplier = 1 + state.org.reputation / 50;
  const facilityValue = state.org.facilityLevel * 12000;
  const base =
    Math.max(0, state.org.bankBalanceUSD) +
    rosterValue +
    facilityValue +
    trophyBonus +
    followerValue;
  return Math.round(base * repMultiplier);
}
