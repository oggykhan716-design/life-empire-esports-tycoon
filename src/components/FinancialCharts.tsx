import React from 'react';
import { formatCurrency } from '../engine/economy';
import { GameState } from '../types/game';

interface FinancialChartsProps {
  state: GameState;
  personalExpensesUSD: number;
  expenseBreakdown: { label: string; amountUSD: number }[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  state,
  personalExpensesUSD,
  expenseBreakdown,
}) => {
  const countryId = state.character.countryId;
  const personalCash = Math.max(0, state.finances.cashUSD);
  const personalBank = Math.max(0, state.finances.bankBalanceUSD);
  const investmentsTotal = state.finances.investments.reduce((s, i) => s + i.currentValueUSD, 0);
  const orgBank = state.org.founded ? Math.max(0, state.org.bankBalanceUSD) : 0;

  const capitalTotal = Math.max(1, personalCash + personalBank + investmentsTotal + orgBank);
  const capitalSegments = [
    { label: 'Wallet Cash', val: personalCash, color: '#38BDF8' },
    { label: 'Personal Bank', val: personalBank, color: '#3B82F6' },
    { label: 'Investments', val: investmentsTotal, color: '#8B5CF6' },
    ...(state.org.founded ? [{ label: 'Org Treasury', val: orgBank, color: '#10B981' }] : []),
  ];

  // Cashflow comparison bars
  const pIncome = Math.max(0, state.finances.lastWeekIncomeUSD);
  const pBurn = Math.max(0, personalExpensesUSD);
  const oRev = state.org.founded ? Math.max(0, state.org.lastWeekRevenueUSD) : 0;
  const oBurn = state.org.founded ? Math.max(0, state.org.lastWeekExpensesUSD) : 0;
  const maxFlow = Math.max(100, pIncome, pBurn, oRev, oBurn);

  const flowBars = [
    { label: 'Personal In', value: pIncome, color: '#3B82F6' },
    { label: 'Personal Out', value: pBurn, color: '#F59E0B' },
    ...(state.org.founded
      ? [
          { label: 'Org Revenue', value: oRev, color: '#10B981' },
          { label: 'Org Burn', value: oBurn, color: '#EF4444' },
        ]
      : []),
  ];

  // Synthetic 6-week projection / trend line for visual telemetry grounded in current balances
  const baseVal = state.org.founded ? state.org.valuationUSD : personalCash + personalBank + investmentsTotal;
  const netDelta = state.org.founded ? oRev - oBurn : pIncome - pBurn;
  const points = [0, 1, 2, 3, 4, 5].map((idx) => {
    const projected = Math.max(0, baseVal + netDelta * (idx - 2) * 0.65);
    return projected;
  });
  const minPt = Math.min(...points);
  const maxPt = Math.max(minPt + 100, ...points);
  const svgCoords = points
    .map((pt, i) => {
      const x = 16 + (i / 5) * 268;
      const y = 76 - ((pt - minPt) / (maxPt - minPt)) * 58;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Capital Distribution Bar & Legend */}
      <div className="lg:col-span-4 fm-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Capital Distribution
          </h3>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {formatCurrency(capitalTotal, countryId, true)}
          </span>
        </div>

        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800/80">
          {capitalSegments.map((seg) => {
            const pct = (seg.val / capitalTotal) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={seg.label}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                className="h-full transition-all duration-300"
                title={`${seg.label}: ${formatCurrency(seg.val, countryId)}`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {capitalSegments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate">{seg.label}</span>
              </div>
              <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(seg.val, countryId, true)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Weekly Cashflow Bar Chart */}
      <div className="lg:col-span-4 fm-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Weekly Cashflow Comparison
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">In vs. Out</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {flowBars.map((bar) => {
            const pct = Math.max(4, Math.round((bar.value / maxFlow) * 100));
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{bar.label}</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(bar.value, countryId)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: bar.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Valuation / Trajectory Sparkline + Living Expense Share */}
      <div className="lg:col-span-4 fm-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            {state.org.founded ? 'Org Valuation Trajectory' : 'Savings Run-Rate'}
          </h3>
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              netDelta >= 0 ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            {netDelta >= 0 ? '+' : ''}
            {formatCurrency(netDelta, countryId, true)}/wk
          </span>
        </div>

        <svg
          viewBox="0 0 300 90"
          className="w-full h-24 overflow-visible"
          role="img"
          aria-label="Financial trajectory chart"
        >
          <defs>
            <linearGradient id="fmChartArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line x1="16" y1="76" x2="284" y2="76" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <polygon
            points={`16,76 ${svgCoords} 284,76`}
            fill="url(#fmChartArea)"
          />
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={svgCoords}
          />
          {points.map((pt, i) => {
            const x = 16 + (i / 5) * 268;
            const y = 76 - ((pt - minPt) / (maxPt - minPt)) * 58;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i === 2 ? 4 : 2.5}
                className={i === 2 ? 'fill-purple-400 stroke-slate-900' : 'fill-blue-400'}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Top Expense: {expenseBreakdown[0]?.label ?? 'Living'}</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(expenseBreakdown[0]?.amountUSD ?? 0, countryId)}
          </span>
        </div>
      </div>
    </div>
  );
};
