import React from 'react';
import {
  Camera,
  Landmark,
  LineChart,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Play,
} from 'lucide-react';
import { formatCurrency } from '../../engine/economy';
import { GameState } from '../../types/game';
import { PhoneAppId } from '../../types/phone';

interface PhoneHomeProps {
  state: GameState;
  onOpenApp: (appId: PhoneAppId) => void;
}

interface AppTile {
  id: PhoneAppId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  unread: number;
}

export const PhoneHome: React.FC<PhoneHomeProps> = ({ state, onOpenApp }) => {
  const ps = state.phoneState;
  if (!ps) return null;

  const unreadByApp = (appId: PhoneAppId) =>
    ps.notifications.filter((n) => n.appId === appId && !n.isRead).length;
  const unreadMessages = ps.messages.filter((m) => !m.isRead).length;

  const apps: AppTile[] = [
    {
      id: 'messenger',
      label: 'Messenger',
      subtitle: 'DMs & Offers',
      icon: MessageCircle,
      gradient: 'from-blue-500 to-indigo-600',
      unread: Math.max(unreadMessages, unreadByApp('messenger')),
    },
    {
      id: 'news',
      label: 'News',
      subtitle: 'Wire & Media',
      icon: Newspaper,
      gradient: 'from-emerald-500 to-teal-600',
      unread: unreadByApp('news'),
    },
    {
      id: 'bank',
      label: 'Bank',
      subtitle: 'Accounts',
      icon: Landmark,
      gradient: 'from-cyan-500 to-blue-600',
      unread: unreadByApp('bank'),
    },
    {
      id: 'stocks',
      label: 'Team Stocks',
      subtitle: 'Esports Exchange',
      icon: LineChart,
      gradient: 'from-violet-500 to-purple-600',
      unread: unreadByApp('stocks'),
    },
    {
      id: 'twitter',
      label: 'Twitter',
      subtitle: 'Live Reactions',
      icon: MessageSquare,
      gradient: 'from-sky-500 to-blue-600',
      unread: unreadByApp('twitter'),
    },
    {
      id: 'instagram',
      label: 'Instagram',
      subtitle: 'Brand & Collabs',
      icon: Camera,
      gradient: 'from-pink-500 to-rose-600',
      unread: unreadByApp('instagram'),
    },
    {
      id: 'youtube',
      label: 'YouTube',
      subtitle: 'Creator Studio',
      icon: Play,
      gradient: 'from-red-500 to-rose-700',
      unread: unreadByApp('youtube'),
    },
  ];

  const portfolioValue = ps.stockMarket.portfolio.reduce((sum, h) => {
    const listing = ps.stockMarket.listings.find((l) => l.ticker === h.ticker);
    return sum + h.shares * (listing?.sharePrice ?? h.avgCostUSD);
  }, 0);

  const latestNews = ps.news[0];

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto h-full">
      {/* Wallet & Market Glance */}
      <div className="rounded-2xl bg-gradient-to-br from-[#141D2E] to-[#0D1320] border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {state.careerType === 'PLAYER' && state.playerCareer
              ? `${state.playerCareer.ign} · ${state.playerCareer.rank}`
              : state.org.founded
              ? `${state.org.name} [${state.org.tag}]`
              : `${state.character.firstName} ${state.character.lastName}`}
          </span>
          <span className="font-mono text-blue-400">
            Yr {state.year} · Wk {state.week}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="text-[11px] text-slate-400">Personal Bank</div>
            <div className="font-mono text-lg font-bold tabular-nums text-white">
              {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId, true)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Stock Portfolio</div>
            <div className="font-mono text-lg font-bold tabular-nums text-violet-400">
              {formatCurrency(portfolioValue, state.character.countryId, true)}
            </div>
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onOpenApp(app.id)}
              className="group flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-slate-800/40 active:scale-95 transition-all min-h-[88px]"
            >
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={25} className="text-white" />
                </div>
                {app.unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#0B0F17]">
                    {app.unread > 99 ? '99+' : app.unread}
                  </span>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-white leading-tight">{app.label}</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{app.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Latest Wire Preview */}
      {latestNews && (
        <button
          type="button"
          onClick={() => onOpenApp('news')}
          className="w-full text-left rounded-2xl bg-[#111826] border border-slate-800/90 hover:border-blue-500/40 p-3.5 space-y-1 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-400">{latestNews.publisherName}</span>
            <span className="font-mono text-slate-500">Wk {latestNews.gameWeek}</span>
          </div>
          <div className="text-xs font-semibold text-white line-clamp-2">
            {latestNews.headline}
          </div>
        </button>
      )}
    </div>
  );
};
