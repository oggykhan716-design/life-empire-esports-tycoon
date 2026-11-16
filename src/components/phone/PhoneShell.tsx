import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Home as HomeIcon,
  Signal,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import {
  markAllPhoneNotificationsRead,
  markAppNotificationsRead,
} from '../../engine/events/eventBus';
import { GameState } from '../../types/game';
import { PhoneAppId } from '../../types/phone';
import { PhoneHome } from './PhoneHome';
import { PhoneNotifications } from './PhoneNotifications';
import { BankApp } from './apps/BankApp';
import { InstagramApp } from './apps/InstagramApp';
import { MessengerApp } from './apps/MessengerApp';
import { NewsApp } from './apps/NewsApp';
import { StocksApp } from './apps/StocksApp';
import { TwitterApp } from './apps/TwitterApp';
import { YouTubeApp } from './apps/YouTubeApp';

interface PhoneShellProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
  onClose: () => void;
}

const APP_TITLES: Record<PhoneAppId, string> = {
  messenger: 'Messenger',
  news: 'Esports Wire',
  bank: 'Apex Bank',
  stocks: 'Team Stocks',
  twitter: 'Twitter',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export const PhoneShell: React.FC<PhoneShellProps> = ({ state, onUpdateState, onClose }) => {
  const [activeApp, setActiveApp] = useState<PhoneAppId | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const ps = state.phoneState;
  if (!ps) return null;

  const unreadNotifs = ps.notifications.filter((n) => !n.isRead).length;

  const handleOpenApp = (appId: PhoneAppId) => {
    setShowNotifs(false);
    setActiveApp(appId);
    if (ps.notifications.some((n) => n.appId === appId && !n.isRead)) {
      onUpdateState(markAppNotificationsRead(state, appId));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Smartphone Interface"
    >
      <div className="w-full h-full sm:h-[680px] sm:max-h-[90vh] sm:max-w-[520px] bg-[#0B0F17] sm:rounded-[32px] border-0 sm:border-[3px] sm:border-slate-700/80 shadow-2xl shadow-black flex flex-col overflow-hidden">
        {/* Smartphone Status Bar */}
        <div className="h-11 px-4 bg-[#080B11] border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <Smartphone size={13} className="text-blue-400" />
            <span>
              Yr {state.year} · Wk {state.week} · D{state.day ?? 1}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Signal size={13} className="text-slate-400" />
            <Wifi size={13} className="text-slate-400" />
            <button
              type="button"
              onClick={() => setShowNotifs((v) => !v)}
              aria-label="Toggle phone notifications"
              className="relative min-h-[34px] min-w-[34px] rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-200"
            >
              <Bell size={15} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close phone"
              className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sub-header when inside an app or notification shade */}
        {(activeApp || showNotifs) && (
          <div className="h-10 px-3 bg-[#0D121C] border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                if (showNotifs) {
                  setShowNotifs(false);
                } else {
                  setActiveApp(null);
                }
              }}
              className="min-h-[34px] px-2 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-300 inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Home
            </button>
            <span className="font-display font-bold text-xs text-white">
              {showNotifs ? 'Notifications' : activeApp ? APP_TITLES[activeApp] : ''}
            </span>
            <div className="w-14" />
          </div>
        )}

        {/* Active App Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {showNotifs ? (
            <PhoneNotifications
              notifications={ps.notifications}
              onOpenApp={handleOpenApp}
              onMarkAllRead={() => onUpdateState(markAllPhoneNotificationsRead(state))}
            />
          ) : activeApp === null ? (
            <PhoneHome state={state} onOpenApp={handleOpenApp} />
          ) : activeApp === 'messenger' ? (
            <MessengerApp state={state} onUpdateState={onUpdateState} />
          ) : activeApp === 'news' ? (
            <NewsApp state={state} />
          ) : activeApp === 'bank' ? (
            <BankApp state={state} onUpdateState={onUpdateState} />
          ) : activeApp === 'stocks' ? (
            <StocksApp state={state} onUpdateState={onUpdateState} />
          ) : activeApp === 'twitter' ? (
            <TwitterApp state={state} onUpdateState={onUpdateState} />
          ) : activeApp === 'instagram' ? (
            <InstagramApp state={state} onUpdateState={onUpdateState} />
          ) : (
            <YouTubeApp state={state} onUpdateState={onUpdateState} />
          )}
        </div>

        {/* Bottom Home Bar */}
        <div className="h-12 px-6 bg-[#080B11] border-t border-slate-800/80 flex items-center justify-around shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowNotifs(false);
              setActiveApp(null);
            }}
            aria-label="Phone Home"
            className="min-h-[40px] px-4 rounded-xl hover:bg-slate-800/70 text-xs font-medium text-slate-300 inline-flex items-center gap-1.5"
          >
            <HomeIcon size={15} />
            Apps
          </button>
          <button
            type="button"
            onClick={() => setShowNotifs((v) => !v)}
            className="min-h-[40px] px-4 rounded-xl hover:bg-slate-800/70 text-xs font-medium text-slate-300 inline-flex items-center gap-1.5"
          >
            <Bell size={15} />
            Alerts {unreadNotifs > 0 ? `(${unreadNotifs})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
