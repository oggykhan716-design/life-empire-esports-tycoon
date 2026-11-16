import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Handshake, Send, X } from 'lucide-react';
import {
  markConversationAsRead,
  resolveMessengerAction,
  sendUserMessengerMessage,
} from '../../../engine/social/messengerEngine';
import { GameState } from '../../../types/game';

interface MessengerAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

export const MessengerApp: React.FC<MessengerAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    ps?.conversations[0]?.id ?? null
  );
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!ps) return;
    if (!selectedConvId && ps.conversations[0]) {
      setSelectedConvId(ps.conversations[0].id);
    }
  }, [ps, selectedConvId]);

  if (!ps) return null;

  const activeConv = ps.conversations.find((c) => c.id === selectedConvId) ?? null;
  const threadMessages = activeConv
    ? ps.messages
        .filter((m) => m.conversationId === activeConv.id)
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const handleOpenConversation = (convId: string) => {
    setSelectedConvId(convId);
    const hasUnread = ps.messages.some((m) => m.conversationId === convId && !m.isRead);
    if (hasUnread) {
      onUpdateState(markConversationAsRead(state, convId));
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !draft.trim()) return;
    const next = sendUserMessengerMessage(state, activeConv.id, draft);
    onUpdateState(next);
    setDraft('');
  };

  const handleAction = (messageId: string, decision: 'accept' | 'reject' | 'negotiate') => {
    const { nextState, feedback } = resolveMessengerAction(state, messageId, decision);
    onUpdateState(nextState, feedback);
  };

  return (
    <div className="flex flex-col sm:flex-row h-full bg-[#0B0F17]">
      {/* Conversation List */}
      <div
        className={`${
          activeConv ? 'hidden sm:flex' : 'flex'
        } sm:w-64 flex-col border-r border-slate-800/80 h-full overflow-y-auto shrink-0`}
      >
        <div className="px-4 py-3 border-b border-slate-800/80 font-display font-bold text-xs text-slate-300 uppercase tracking-wider">
          Conversations ({ps.conversations.length})
        </div>
        {ps.conversations.length === 0 ? (
          <div className="p-6 text-xs text-slate-400">No messages yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {ps.conversations.map((conv) => {
              const unread = ps.messages.filter(
                (m) => m.conversationId === conv.id && !m.isRead
              ).length;
              const lastMsg = ps.messages.find((m) => m.conversationId === conv.id);
              const selected = conv.id === activeConv?.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleOpenConversation(conv.id)}
                  className={`w-full text-left px-3.5 py-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors ${
                    selected ? 'bg-blue-600/15 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-xs shrink-0"
                    style={{ backgroundColor: conv.avatarColor }}
                  >
                    {conv.participantName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate">
                        {conv.participantName}
                      </span>
                      {unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {conv.participantRole}
                    </div>
                    {lastMsg && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {lastMsg.content}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Chat Thread */}
      <div className={`${activeConv ? 'flex' : 'hidden sm:flex'} flex-1 flex-col h-full min-w-0`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-6">
            Select a conversation to read messages and respond to offers.
          </div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-3 bg-[#0E1420]">
              <button
                type="button"
                onClick={() => setSelectedConvId(null)}
                aria-label="Back to conversations"
                className="sm:hidden min-h-[38px] min-w-[38px] rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-300"
              >
                <ArrowLeft size={16} />
              </button>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-display font-bold text-xs shrink-0"
                style={{ backgroundColor: activeConv.avatarColor }}
              >
                {activeConv.participantName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {activeConv.participantName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeConv.participantRole}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {threadMessages.map((msg) => {
                const isSelf = msg.senderId === 'user_self';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isSelf
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-[#141D2E] border border-slate-800 text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.content}</p>

                      {msg.action && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
                            {msg.action.orgName && (
                              <span className="font-semibold text-blue-400">{msg.action.orgName}</span>
                            )}
                            {msg.action.monthlySalaryUSD && (
                              <span className="font-mono">
                                ${msg.action.monthlySalaryUSD.toLocaleString()}/mo
                              </span>
                            )}
                            {msg.action.weeklyPayoutUSD && (
                              <span className="font-mono">
                                ${msg.action.weeklyPayoutUSD.toLocaleString()}/wk
                              </span>
                            )}
                            {msg.action.signingBonusUSD && (
                              <span className="font-mono text-emerald-400">
                                +${msg.action.signingBonusUSD.toLocaleString()} bonus
                              </span>
                            )}
                          </div>

                          {msg.action.status === 'pending' ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAction(msg.id, 'accept')}
                                className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Check size={13} />
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(msg.id, 'negotiate')}
                                className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Handshake size={13} />
                                Negotiate +15%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(msg.id, 'reject')}
                                className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <X size={13} />
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                              Offer {msg.action.status}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">
                      Wk {msg.gameWeek}
                    </span>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSend}
              className="p-3 border-t border-slate-800/80 bg-[#0E1420] flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to ${activeConv.participantName}...`}
                className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="min-h-[42px] min-w-[42px] rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
