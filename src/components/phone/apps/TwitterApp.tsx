import React, { useState } from 'react';
import {
  BadgeCheck,
  Flame,
  Heart,
  MessageSquare,
  Repeat2,
  Send,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  publishUserTweet,
  replyToTweet,
  toggleFollowTwitterAccount,
  toggleLikeTweet,
  toggleRepostTweet,
} from '../../../engine/social/twitterEngine';
import { GameState } from '../../../types/game';

interface TwitterAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

export const TwitterApp: React.FC<TwitterAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [feedTab, setFeedTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'TRENDING'>('FOR_YOU');
  const [composeText, setComposeText] = useState('');
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  if (!ps) return null;

  const userAccount = ps.twitterAccounts.find((a) => a.id === 'user_self');
  const followingIds = new Set(
    ps.twitterAccounts.filter((a) => a.following).map((a) => a.id)
  );

  const visibleTweets = ps.tweets.filter((tw) => {
    if (filterTag && !tw.hashtags.some((h) => h.toLowerCase() === filterTag.toLowerCase())) {
      return false;
    }
    if (feedTab === 'FOLLOWING') {
      return followingIds.has(tw.authorId) || tw.authorId === 'user_self';
    }
    return true;
  });

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim()) return;
    const next = publishUserTweet(state, composeText);
    onUpdateState(next, 'Post published on Twitter!');
    setComposeText('');
  };

  const handleReplySubmit = (e: React.FormEvent, tweetId: string) => {
    e.preventDefault();
    if (!replyDraft.trim()) return;
    const next = replyToTweet(state, tweetId, replyDraft);
    onUpdateState(next);
    setReplyDraft('');
    setReplyOpenId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]">
      {/* Header Tabs */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-[#0E1420] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-white truncate">
              {userAccount?.displayName ?? 'Esports Timeline'}
            </span>
            <span className="text-slate-400 font-mono truncate">{userAccount?.handle}</span>
          </div>
          <span className="font-mono text-[11px] text-sky-400 shrink-0">
            {(userAccount?.followers ?? 0).toLocaleString()} followers
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'FOR_YOU', label: 'For You' },
              { id: 'FOLLOWING', label: 'Following' },
              { id: 'TRENDING', label: 'Trending' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setFeedTab(t.id);
                setFilterTag(null);
              }}
              className={`flex-1 min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                feedTab === t.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-[#141D2E] text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filterTag && (
          <div className="flex items-center justify-between text-[11px] text-sky-400 pt-1">
            <span>Filtering by {filterTag}</span>
            <button
              type="button"
              onClick={() => setFilterTag(null)}
              className="underline text-slate-300"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Compose Form */}
      <form onSubmit={handleCompose} className="p-3 border-b border-slate-800/80 flex gap-2 bg-[#0D131E]">
        <input
          type="text"
          maxLength={280}
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          placeholder="Post an update to the esports timeline (#Esports)..."
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!composeText.trim()}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Send size={13} />
          Post
        </button>
      </form>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
        {feedTab === 'TRENDING' && !filterTag ? (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                <Flame size={15} className="text-amber-400" />
                Trending Hashtags
              </div>
              {ps.trendingTopics.length === 0 ? (
                <div className="text-xs text-slate-400 py-4">
                  Play matches or make roster moves to ignite trending topics.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70 rounded-xl border border-slate-800 bg-[#111826]">
                  {ps.trendingTopics.map((topic) => (
                    <button
                      key={topic.tag}
                      type="button"
                      onClick={() => {
                        setFilterTag(topic.tag);
                        setFeedTab('FOR_YOU');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800/40 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">{topic.tag}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {topic.postsCount} posts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{topic.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-display font-bold text-white">
                Notable Esports Accounts
              </div>
              <div className="divide-y divide-slate-800/70 rounded-xl border border-slate-800 bg-[#111826]">
                {ps.twitterAccounts
                  .filter((a) => a.id !== 'user_self')
                  .slice(0, 14)
                  .map((acc) => (
                    <div
                      key={acc.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-xs font-semibold text-white truncate">
                          <span className="truncate">{acc.displayName}</span>
                          {acc.verified && <BadgeCheck size={13} className="text-sky-400 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {acc.handle} · {acc.followers.toLocaleString()} followers
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateState(toggleFollowTwitterAccount(state, acc.id))}
                        className={`min-h-[34px] px-3 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                          acc.following
                            ? 'border border-slate-700 text-slate-300'
                            : 'bg-sky-600 text-white'
                        }`}
                      >
                        {acc.following ? <UserCheck size={12} /> : <UserPlus size={12} />}
                        {acc.following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : visibleTweets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Timeline is quiet. Compete in matches, make signings, or post your own update above!
          </div>
        ) : (
          visibleTweets.map((tw) => {
            const acc = ps.twitterAccounts.find((a) => a.id === tw.authorId);
            const isSelf = tw.authorId === 'user_self';
            return (
              <div key={tw.id} className="p-4 space-y-2.5 hover:bg-slate-900/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-xs shrink-0"
                      style={{ backgroundColor: tw.avatarColor }}
                    >
                      {tw.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-white truncate">
                        <span className="truncate">{tw.authorName}</span>
                        {tw.verified && <BadgeCheck size={13} className="text-sky-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {tw.authorHandle} · Wk {tw.gameWeek}
                      </div>
                    </div>
                  </div>
                  {!isSelf && acc && (
                    <button
                      type="button"
                      onClick={() => onUpdateState(toggleFollowTwitterAccount(state, acc.id))}
                      className="text-[11px] font-semibold text-sky-400 hover:underline shrink-0"
                    >
                      {acc.following ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-100 leading-relaxed">{tw.content}</p>

                {tw.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-sky-400">
                    {tw.hashtags.map((tag, i) => (
                      <button
                        key={`${tag}_${i}`}
                        type="button"
                        onClick={() => setFilterTag(tag)}
                        className="hover:underline"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-5 pt-1 text-[11px] font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => onUpdateState(toggleLikeTweet(state, tw.id))}
                    className={`min-h-[32px] inline-flex items-center gap-1.5 transition-colors ${
                      tw.likedByUser ? 'text-rose-400' : 'hover:text-rose-400'
                    }`}
                  >
                    <Heart size={14} className={tw.likedByUser ? 'fill-current' : ''} />
                    {tw.likes.toLocaleString()}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateState(toggleRepostTweet(state, tw.id))}
                    className={`min-h-[32px] inline-flex items-center gap-1.5 transition-colors ${
                      tw.repostedByUser ? 'text-emerald-400' : 'hover:text-emerald-400'
                    }`}
                  >
                    <Repeat2 size={14} />
                    {tw.reposts.toLocaleString()}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyOpenId(replyOpenId === tw.id ? null : tw.id)}
                    className="min-h-[32px] inline-flex items-center gap-1.5 hover:text-sky-400 transition-colors"
                  >
                    <MessageSquare size={14} />
                    {tw.repliesCount.toLocaleString()}
                  </button>

                  <span className="ml-auto text-slate-500">
                    {tw.views.toLocaleString()} views
                  </span>
                </div>

                {tw.replies.length > 0 && (
                  <div className="mt-2 pl-3 border-l border-slate-800 space-y-1.5">
                    {tw.replies.map((r) => (
                      <div key={r.id} className="text-[11px]">
                        <span className="font-semibold text-white">{r.authorName}</span>{' '}
                        <span className="text-slate-500">{r.authorHandle}</span>:{' '}
                        <span className="text-slate-300">{r.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {replyOpenId === tw.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, tw.id)} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Write your reply..."
                      className="flex-1 min-h-[36px] px-3 py-1 rounded-lg bg-[#0E1420] border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="min-h-[36px] px-3 py-1 rounded-lg bg-sky-600 text-white text-xs font-semibold"
                    >
                      Reply
                    </button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
