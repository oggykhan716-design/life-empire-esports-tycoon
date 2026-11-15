import React from 'react';
import { Globe2, Newspaper, Trophy } from 'lucide-react';
import { getGameById } from '../data/esportsTitles';
import { formatCurrency } from '../engine/economy';
import { GameState } from '../types/game';
import { OrgCrest } from './OrgCrest';

interface WorldViewProps {
  state: GameState;
}

export const WorldView: React.FC<WorldViewProps> = ({ state }) => {
  const leaderboard = [
    ...state.rivals.map((r) => ({
      id: r.id,
      name: r.name,
      tag: r.tag,
      color: r.color,
      icon: 'shield',
      region: r.region,
      valuationUSD: r.valuationUSD,
      reputation: r.reputation,
      trophies: r.trophies,
      status: r.status,
      trend: r.recentTrend,
      isPlayer: false,
      identity: r.identity,
    })),
    ...(state.org.founded
      ? [
          {
            id: 'player_org',
            name: state.org.name,
            tag: state.org.tag,
            color: state.org.color,
            icon: state.org.icon,
            region: state.org.headquarters,
            valuationUSD: state.org.valuationUSD,
            reputation: state.org.reputation,
            trophies: state.org.trophies.length,
            status: 'Active' as const,
            trend: 'Rising' as const,
            isPlayer: true,
            identity: 'Your independent organization climbing the global ranks.',
          },
        ]
      : []),
  ].sort((a, b) => b.valuationUSD - a.valuationUSD);

  return (
    <div className="space-y-6">
      {/* Global Organization Rankings */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 size={20} className="text-blue-600" />
            Global Organization Rankings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rival organizations compete, grow, decline, and face financial shifts independently each week.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Rank</th>
                <th className="py-2.5 pr-4 font-medium">Organization</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 pr-4 font-medium text-right">Rep</th>
                <th className="py-2.5 pr-4 font-medium text-right">Trophies</th>
                <th className="py-2.5 font-medium text-right">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {leaderboard.map((row, idx) => (
                <tr
                  key={row.id}
                  className={
                    row.isPlayer
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 font-medium'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                  }
                >
                  <td className="py-3 pr-3 font-mono text-xs text-slate-500 tabular-nums">
                    #{idx + 1}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <OrgCrest
                        name={row.name}
                        tag={row.tag}
                        color={row.color}
                        icon={row.icon}
                        size="sm"
                      />
                      <div>
                        <div className="font-display font-semibold text-slate-900 dark:text-white">
                          {row.name}{' '}
                          <span className="font-mono text-xs text-slate-400">[{row.tag}]</span>
                          {row.isPlayer && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 ml-1.5">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {row.region} · {row.identity}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    <span
                      className={
                        row.status === 'Bankrupt'
                          ? 'text-red-600 font-semibold'
                          : row.status === 'Declining'
                          ? 'text-amber-600 font-medium'
                          : 'text-emerald-700 dark:text-emerald-400 font-medium'
                      }
                    >
                      {row.status} · {row.trend}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-right tabular-nums">
                    {row.reputation}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-right tabular-nums">
                    {row.trophies}
                  </td>
                  <td className="py-3 font-mono text-xs font-semibold text-right tabular-nums">
                    {formatCurrency(row.valuationUSD, state.character.countryId, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Esports World News */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper size={18} className="text-blue-600" />
            Esports Wire &amp; News
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.worldNews.map((item) => (
              <div key={item.id} className="py-3.5 space-y-1">
                <div className="text-xs font-mono text-slate-400">Week {item.week}</div>
                <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  {item.headline}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Global Major & World Championships Overview */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy size={18} className="text-blue-600" />
            Major International &amp; World Circuits
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1">
            {state.tournaments
              .filter(
                (t) =>
                  t.tier === 'Major International' || t.tier === 'World Championship'
              )
              .slice(0, 12)
              .map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      {t.tier} · {getGameById(t.gameId).name}
                    </div>
                    <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                      {t.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(t.prizePoolUSD, state.character.countryId, true)}
                    </div>
                    <div className="text-[11px] text-slate-400">Req {t.minRankPoints} pts</div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};
