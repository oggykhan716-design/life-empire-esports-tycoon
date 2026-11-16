import React from 'react';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { PhoneAppId, PhoneNotification } from '../../types/phone';

interface PhoneNotificationsProps {
  notifications: PhoneNotification[];
  onOpenApp: (appId: PhoneAppId) => void;
  onMarkAllRead: () => void;
}

const APP_LABEL: Record<PhoneAppId, { label: string; accent: string }> = {
  messenger: { label: 'Messenger', accent: 'text-blue-400' },
  news: { label: 'Esports News', accent: 'text-emerald-400' },
  bank: { label: 'Bank', accent: 'text-cyan-400' },
  stocks: { label: 'Team Stocks', accent: 'text-violet-400' },
  twitter: { label: 'Twitter', accent: 'text-sky-400' },
  instagram: { label: 'Instagram', accent: 'text-pink-400' },
  youtube: { label: 'YouTube', accent: 'text-red-400' },
};

export const PhoneNotifications: React.FC<PhoneNotificationsProps> = ({
  notifications,
  onOpenApp,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-blue-400" />
          <span className="font-display font-bold text-sm text-white">Notification Center</span>
          {unreadCount > 0 && (
            <span className="font-mono text-xs text-blue-400 font-semibold">
              · {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 inline-flex items-center gap-1.5"
          >
            <CheckCheck size={14} />
            Mark read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No notifications yet. Events from matches, contracts, media, and markets appear here.
          </div>
        ) : (
          notifications.map((n) => {
            const meta = APP_LABEL[n.appId];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onOpenApp(n.appId)}
                className={`w-full text-left px-4 py-3.5 hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 ${
                  !n.isRead ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`font-semibold ${meta.accent}`}>{meta.label}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-slate-400">
                      Wk {n.gameWeek} · D{n.gameDay}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white truncate">{n.title}</div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                </div>
                <ChevronRight size={16} className="text-slate-500 shrink-0 mt-1" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
