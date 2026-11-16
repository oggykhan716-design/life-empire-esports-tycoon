import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, LineChart, Rocket } from 'lucide-react';
import { formatCurrency } from '../../../engine/economy';
import {
  buyStockShares,
  listPlayerOrgOnExchange,
  sellStockShares,
} from '../../../engine/economy/stocksEngine';
import { GameState } from '../../../types/game';
import { StockListing } from '../../../types/finance';

interface StocksAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

const Sparkline: React.FC<{ points: number[]; color: string }> = ({ points, color }) => {
  if (points.length < 2) {
    return <div className="h-10 w-full flex items-center text-[10px] font-mono text-slate-500">Initial IPO Quote</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(0.01, max - min);
  const width = 180;
  const height = 40;
  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - 4 - ((p - min) / span) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
};

export const StocksApp: React.FC<StocksAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [selectedTicker, setSelectedTicker] = useState<string>(
    ps?.stockMarket.listings[0]?.ticker ?? ''
  );
  const [shareQty, setShareQty] = useState('10');
  const [tradeError, setTradeError] = useState<string | null>(null);

  if (!ps) return null;

  const market = ps.stockMarket;
  const selectedListing: StockListing | undefined =
    market.listings.find((l) => l.ticker === selectedTicker) ?? market.listings[0];

  const portfolioValueUSD = market.portfolio.reduce((sum, h) => {
    const l = market.listings.find((x) => x.ticker === h.ticker);
    return sum + h.shares * (l?.sharePrice ?? h.avgCostUSD);
  }, 0);

  const portfolioCostUSD = market.portfolio.reduce(
    (sum, h) => sum + h.shares * h.avgCostUSD,
    0
  );
  const netPnL = portfolioValueUSD - portfolioCostUSD;

  const canIpo =
    state.org.founded &&
    !market.listings.some((l) => l.isPlayerOrg || l.orgId === 'player_org');

  const handleBuy = () => {
    if (!selectedListing) return;
    const res = buyStockShares(state, selectedListing.ticker, Number(shareQty));
    if (res.error) {
      setTradeError(res.error);
      return;
    }
    setTradeError(null);
    onUpdateState(
      res.nextState,
      `Bought ${Math.floor(Number(shareQty))} shares of ${selectedListing.ticker}.`
    );
  };

  const handleSell = () => {
    if (!selectedListing) return;
    const res = sellStockShares(state, selectedListing.ticker, Number(shareQty));
    if (res.error) {
      setTradeError(res.error);
      return;
    }
    setTradeError(null);
    onUpdateState(
      res.nextState,
      `Sold ${Math.floor(Number(shareQty))} shares of ${selectedListing.ticker}.`
    );
  };

  const handleIpo = () => {
    const res = listPlayerOrgOnExchange(state);
    if (res.error) {
      setTradeError(res.error);
      return;
    }
    setTradeError(null);
    onUpdateState(res.nextState, `${state.org.name} is now publicly traded on the Esports Exchange!`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] overflow-y-auto p-4 space-y-4">
      {/* Portfolio Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#161B30] to-[#0D121F] border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
            <LineChart size={15} />
            Esports Equity Exchange
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Bank {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId, true)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-400">Portfolio Value</div>
            <div className="font-mono text-xl font-extrabold tabular-nums text-white">
              {formatCurrency(portfolioValueUSD, state.character.countryId, true)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Unrealized P&amp;L</div>
            <div
              className={`font-mono text-xl font-extrabold tabular-nums ${
                netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {netPnL >= 0 ? '+' : ''}
              {formatCurrency(netPnL, state.character.countryId, true)}
            </div>
          </div>
        </div>

        {canIpo && (
          <button
            type="button"
            onClick={handleIpo}
            className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-200 text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <Rocket size={14} />
            List {state.org.name} IPO on Exchange
          </button>
        )}
      </div>

      {/* Selected Listing Trade Desk */}
      {selectedListing && (
        <div className="rounded-2xl bg-[#111826] border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {selectedListing.ticker}
                </span>
                <span className="text-xs text-slate-400">{selectedListing.orgName}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Rep {selectedListing.publicReputation} · Health {selectedListing.financialHealth}/100 · Float{' '}
                {selectedListing.availableShares.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-white tabular-nums">
                ${selectedListing.sharePrice.toFixed(2)}
              </div>
              <div
                className={`font-mono text-xs font-semibold inline-flex items-center gap-0.5 ${
                  selectedListing.dailyChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {selectedListing.dailyChangePct >= 0 ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {selectedListing.dailyChangePct >= 0 ? '+' : ''}
                {selectedListing.dailyChangePct.toFixed(2)}%
              </div>
            </div>
          </div>

          <Sparkline
            points={selectedListing.history.map((h) => h.price)}
            color={selectedListing.dailyChangePct >= 0 ? '#10B981' : '#EF4444'}
          />

          {(() => {
            const owned = market.portfolio.find((h) => h.ticker === selectedListing.ticker);
            return (
              <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>
                  Owned: <strong>{owned ? owned.shares.toLocaleString() : 0}</strong> shares
                </span>
                {owned && (
                  <span>Avg Cost: ${owned.avgCostUSD.toFixed(2)}</span>
                )}
              </div>
            );
          })()}

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              step={5}
              value={shareQty}
              onChange={(e) => setShareQty(e.target.value)}
              className="w-24 min-h-[42px] px-3 py-1.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs font-mono text-white"
            />
            <button
              type="button"
              onClick={handleBuy}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              Buy (${(selectedListing.sharePrice * Math.max(0, Math.floor(Number(shareQty) || 0))).toFixed(0)})
            </button>
            <button
              type="button"
              onClick={handleSell}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              Sell
            </button>
          </div>
          {tradeError && <p className="text-[11px] text-red-400">{tradeError}</p>}
        </div>
      )}

      {/* Market Listings */}
      <div className="rounded-2xl bg-[#111826] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800/80 text-xs font-display font-bold text-white">
          Public Organisations ({market.listings.length})
        </div>
        <div className="divide-y divide-slate-800/70">
          {market.listings.map((l) => {
            const active = selectedListing?.ticker === l.ticker;
            const holding = market.portfolio.find((h) => h.ticker === l.ticker);
            return (
              <button
                key={l.ticker}
                type="button"
                onClick={() => {
                  setSelectedTicker(l.ticker);
                  setTradeError(null);
                }}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors ${
                  active ? 'bg-violet-600/10' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.ticker}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {l.orgName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {holding ? `${holding.shares} shs` : `Rep ${l.publicReputation}`}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    ${l.sharePrice.toFixed(2)}
                  </div>
                  <div
                    className={`font-mono text-[11px] font-semibold tabular-nums ${
                      l.dailyChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {l.dailyChangePct >= 0 ? '+' : ''}
                    {l.dailyChangePct.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
