import { WorldEvent } from '../events/types';
import { GameState, PlayerOrganization, RivalOrganization } from '../../types/game';
import { StockListing, StockMarket } from '../../types/finance';
import { appendBankTransaction } from './bankEngine';

const FIXED_TOTAL_SHARES = 100000;
const MIN_SHARE_PRICE = 1.5;

function priceFromValuation(valuationUSD: number): number {
  return Math.max(MIN_SHARE_PRICE, Number((valuationUSD / FIXED_TOTAL_SHARES).toFixed(2)));
}

export function buildListingFromRival(rival: RivalOrganization, week: number, day: number): StockListing {
  const basePrice = priceFromValuation(rival.valuationUSD);
  return {
    ticker: rival.tag.toUpperCase(),
    orgId: rival.id,
    orgName: rival.name,
    color: rival.color,
    isPlayerOrg: false,
    sharePrice: basePrice,
    previousPrice: basePrice,
    totalShares: FIXED_TOTAL_SHARES,
    availableShares: Math.round(FIXED_TOTAL_SHARES * 0.45),
    dailyChangePct: 0,
    financialHealth: Math.max(10, Math.min(100, Math.round((rival.bankBalanceUSD / 1_500_000) * 100))),
    publicReputation: rival.reputation,
    history: [{ week, day, price: basePrice }],
    processedEventIds: [],
  };
}

export function buildListingFromPlayerOrg(org: PlayerOrganization, week: number, day: number): StockListing {
  const basePrice = priceFromValuation(Math.max(150000, org.valuationUSD));
  return {
    ticker: (org.tag || 'ORG').toUpperCase(),
    orgId: 'player_org',
    orgName: org.name,
    color: org.color,
    isPlayerOrg: true,
    sharePrice: basePrice,
    previousPrice: basePrice,
    totalShares: FIXED_TOTAL_SHARES,
    availableShares: Math.round(FIXED_TOTAL_SHARES * 0.4),
    dailyChangePct: 0,
    financialHealth: org.bankBalanceUSD > 50000 ? 82 : org.bankBalanceUSD > 10000 ? 60 : 32,
    publicReputation: org.reputation,
    history: [{ week, day, price: basePrice }],
    processedEventIds: [],
  };
}

export function createInitialStockMarket(
  rivals: RivalOrganization[],
  org: PlayerOrganization,
  week = 1,
  day = 1
): StockMarket {
  const listings = rivals
    .filter((r) => r.status !== 'Acquired')
    .map((r) => buildListingFromRival(r, week, day));

  if (org.founded && org.valuationUSD >= 150000) {
    listings.unshift(buildListingFromPlayerOrg(org, week, day));
  }

  return {
    listings,
    portfolio: [],
    lastUpdatedWeek: week,
    lastUpdatedDay: day,
  };
}

export function applyEventToStocks(
  market: StockMarket,
  event: WorldEvent,
  rng: () => number
): StockMarket {
  const actorId = event.actorId;
  const targetId = event.targetId;
  const p = event.payload;

  const updatedListings = market.listings.map((listing) => {
    if (listing.processedEventIds.includes(event.id)) {
      return listing;
    }

    const isActor = actorId === listing.orgId || p.orgId === listing.orgId;
    const isTarget = targetId === listing.orgId || p.opponentId === listing.orgId;
    if (!isActor && !isTarget) return listing;

    let impact = 0;
    if (event.type === 'TOURNAMENT_COMPLETED') {
      const winnerOrgId = p.winnerOrgId as string | undefined;
      if (winnerOrgId === listing.orgId) {
        impact += 0.03 + rng() * 0.05; // +3% to +8%
      } else if (isActor || isTarget) {
        impact -= 0.01 + rng() * 0.03; // -1% to -4%
      }
    } else if (event.type === 'MATCH_COMPLETED') {
      const won = Boolean(p.won);
      if (isActor) {
        impact += won ? 0.012 + rng() * 0.025 : -(0.01 + rng() * 0.025);
      } else if (isTarget) {
        impact += won ? -(0.01 + rng() * 0.022) : 0.012 + rng() * 0.022;
      }
    } else if (event.type === 'TEAM_ELIMINATED' && isActor) {
      impact -= 0.015 + rng() * 0.025;
    } else if (event.type === 'SPONSORSHIP_SIGNED' && isActor) {
      impact += 0.02 + rng() * 0.03; // +2% to +5%
    } else if ((event.type === 'PLAYER_SIGNED' || event.type === 'PLAYER_TRANSFERRED') && isActor) {
      impact += 0.01 + rng() * 0.03; // +1% to +4%
    } else if (event.type === 'CONTROVERSY_CREATED' && isActor) {
      impact -= 0.02 + rng() * 0.06; // -2% to -8%
    } else if (event.type === 'ORGANISATION_BANKRUPTCY' && isActor) {
      impact -= 0.05 + rng() * 0.07; // -5% to -12%
    }

    if (impact === 0) return listing;

    const marketVariation = (rng() - 0.5) * 0.012;
    const totalChange = Math.max(-0.15, Math.min(0.18, impact + marketVariation));
    const newPrice = Math.max(
      MIN_SHARE_PRICE,
      Number((listing.sharePrice * (1 + totalChange)).toFixed(2))
    );
    const pct = Number((((newPrice - listing.sharePrice) / listing.sharePrice) * 100).toFixed(2));

    return {
      ...listing,
      previousPrice: listing.sharePrice,
      sharePrice: newPrice,
      dailyChangePct: pct,
      history: [...listing.history, { week: event.gameWeek, day: event.gameDay, price: newPrice }].slice(-40),
      processedEventIds: [...listing.processedEventIds.slice(-60), event.id],
    };
  });

  return {
    ...market,
    listings: updatedListings,
    lastUpdatedWeek: event.gameWeek,
    lastUpdatedDay: event.gameDay,
  };
}

export function tickWeeklyStockMarket(
  market: StockMarket,
  rivals: RivalOrganization[],
  org: PlayerOrganization,
  week: number,
  day: number,
  rng: () => number
): StockMarket {
  const existingIds = new Set(market.listings.map((l) => l.orgId));
  let listings = [...market.listings];

  // Add newly active rivals if missing
  rivals.forEach((r) => {
    if (!existingIds.has(r.id) && r.status !== 'Acquired') {
      listings.push(buildListingFromRival(r, week, day));
    }
  });

  // Gentle market drift anchored toward financial health & trend
  listings = listings.map((l) => {
    const rival = rivals.find((r) => r.id === l.orgId);
    const trendBias =
      rival?.recentTrend === 'Rising'
        ? 0.008
        : rival?.recentTrend === 'Slumping'
        ? -0.01
        : l.isPlayerOrg
        ? org.reputation >= 50
          ? 0.006
          : 0
        : 0;
    const variation = (rng() - 0.49) * 0.035;
    const delta = Math.max(-0.12, Math.min(0.12, trendBias + variation));
    const newPrice = Math.max(MIN_SHARE_PRICE, Number((l.sharePrice * (1 + delta)).toFixed(2)));
    const pct = Number((((newPrice - l.sharePrice) / l.sharePrice) * 100).toFixed(2));

    return {
      ...l,
      previousPrice: l.sharePrice,
      sharePrice: newPrice,
      dailyChangePct: pct,
      financialHealth: rival
        ? Math.max(5, Math.min(100, Math.round((rival.bankBalanceUSD / 1_500_000) * 100)))
        : org.bankBalanceUSD > 50000
        ? 85
        : 55,
      publicReputation: rival ? rival.reputation : org.reputation,
      history: [...l.history, { week, day, price: newPrice }].slice(-40),
    };
  });

  return {
    ...market,
    listings,
    lastUpdatedWeek: week,
    lastUpdatedDay: day,
  };
}

export function buyStockShares(
  state: GameState,
  ticker: string,
  sharesToBuy: number
): { nextState: GameState; error?: string } {
  if (!state.phoneState) return { nextState: state, error: 'Phone market unavailable.' };
  const qty = Math.floor(sharesToBuy);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { nextState: state, error: 'Enter a valid whole number of shares.' };
  }

  const listing = state.phoneState.stockMarket.listings.find((l) => l.ticker === ticker);
  if (!listing) return { nextState: state, error: 'Organisation stock listing not found.' };
  if (qty > listing.availableShares) {
    return { nextState: state, error: `Only ${listing.availableShares.toLocaleString()} shares available.` };
  }

  const totalCostUSD = Number((listing.sharePrice * qty).toFixed(2));
  const availableFunds = state.finances.bankBalanceUSD + state.finances.cashUSD;
  if (availableFunds < totalCostUSD) {
    return { nextState: state, error: 'Insufficient personal balance to purchase shares.' };
  }

  // Deduct from Personal Bank first, then Cash if needed
  let nextBank = state.finances.bankBalanceUSD;
  let nextCash = state.finances.cashUSD;
  if (nextBank >= totalCostUSD) {
    nextBank = Number((nextBank - totalCostUSD).toFixed(2));
  } else {
    const rem = totalCostUSD - nextBank;
    nextBank = 0;
    nextCash = Math.max(0, Number((nextCash - rem).toFixed(2)));
  }

  const existingHolding = state.phoneState.stockMarket.portfolio.find((h) => h.ticker === ticker);
  const nextPortfolio = existingHolding
    ? state.phoneState.stockMarket.portfolio.map((h) => {
        if (h.ticker !== ticker) return h;
        const totalShares = h.shares + qty;
        const avgCostUSD = Number(
          ((h.avgCostUSD * h.shares + totalCostUSD) / totalShares).toFixed(2)
        );
        return { ...h, shares: totalShares, avgCostUSD };
      })
    : [
        ...state.phoneState.stockMarket.portfolio,
        {
          ticker,
          orgId: listing.orgId,
          shares: qty,
          avgCostUSD: listing.sharePrice,
        },
      ];

  const nextListings = state.phoneState.stockMarket.listings.map((l) =>
    l.ticker === ticker ? { ...l, availableShares: l.availableShares - qty } : l
  );

  const nextTransactions = appendBankTransaction(state.phoneState.transactions, {
    accountId: 'personal_bank',
    type: 'EXPENSE',
    category: 'Stock Purchase',
    amount: Math.round(totalCostUSD),
    description: `Bought ${qty.toLocaleString()} ${ticker} shares @ $${listing.sharePrice.toFixed(2)}`,
    timestamp: Date.now(),
    gameWeek: state.week,
  });

  return {
    nextState: {
      ...state,
      finances: {
        ...state.finances,
        bankBalanceUSD: nextBank,
        cashUSD: nextCash,
      },
      phoneState: {
        ...state.phoneState,
        transactions: nextTransactions,
        stockMarket: {
          ...state.phoneState.stockMarket,
          listings: nextListings,
          portfolio: nextPortfolio,
        },
      },
    },
  };
}

export function sellStockShares(
  state: GameState,
  ticker: string,
  sharesToSell: number
): { nextState: GameState; error?: string } {
  if (!state.phoneState) return { nextState: state, error: 'Phone market unavailable.' };
  const qty = Math.floor(sharesToSell);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { nextState: state, error: 'Enter a valid whole number of shares.' };
  }

  const holding = state.phoneState.stockMarket.portfolio.find((h) => h.ticker === ticker);
  if (!holding || holding.shares < qty) {
    return { nextState: state, error: 'You do not own enough shares to complete this sale.' };
  }

  const listing = state.phoneState.stockMarket.listings.find((l) => l.ticker === ticker);
  if (!listing) return { nextState: state, error: 'Listing unavailable.' };

  const proceedsUSD = Number((listing.sharePrice * qty).toFixed(2));
  const nextPortfolio = state.phoneState.stockMarket.portfolio
    .map((h) => (h.ticker === ticker ? { ...h, shares: h.shares - qty } : h))
    .filter((h) => h.shares > 0);

  const nextListings = state.phoneState.stockMarket.listings.map((l) =>
    l.ticker === ticker ? { ...l, availableShares: l.availableShares + qty } : l
  );

  const nextTransactions = appendBankTransaction(state.phoneState.transactions, {
    accountId: 'personal_bank',
    type: 'INCOME',
    category: 'Stock Sale',
    amount: Math.round(proceedsUSD),
    description: `Sold ${qty.toLocaleString()} ${ticker} shares @ $${listing.sharePrice.toFixed(2)}`,
    timestamp: Date.now(),
    gameWeek: state.week,
  });

  return {
    nextState: {
      ...state,
      finances: {
        ...state.finances,
        bankBalanceUSD: Number((state.finances.bankBalanceUSD + proceedsUSD).toFixed(2)),
      },
      phoneState: {
        ...state.phoneState,
        transactions: nextTransactions,
        stockMarket: {
          ...state.phoneState.stockMarket,
          listings: nextListings,
          portfolio: nextPortfolio,
        },
      },
    },
  };
}

export function listPlayerOrgOnExchange(state: GameState): { nextState: GameState; error?: string } {
  if (!state.phoneState) return { nextState: state, error: 'Phone unavailable.' };
  if (!state.org.founded) return { nextState: state, error: 'Found an organisation before filing an IPO.' };
  const alreadyListed = state.phoneState.stockMarket.listings.some((l) => l.isPlayerOrg || l.orgId === 'player_org');
  if (alreadyListed) return { nextState: state, error: 'Your organisation is already publicly listed.' };
  if (!state.isSandbox && state.org.valuationUSD < 100000) {
    return { nextState: state, error: 'Minimum $100,000 valuation required to list on the Esports Exchange.' };
  }

  const listing = buildListingFromPlayerOrg(state.org, state.week, state.day ?? 1);
  return {
    nextState: {
      ...state,
      phoneState: {
        ...state.phoneState,
        stockMarket: {
          ...state.phoneState.stockMarket,
          listings: [listing, ...state.phoneState.stockMarket.listings],
        },
      },
    },
  };
}
