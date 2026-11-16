import React, { useState } from 'react';
import { Camera, Heart, Sparkles, Trophy } from 'lucide-react';
import {
  publishUserInstagramPost,
  setupUserInstagramAccount,
  toggleLikeInstagramPost,
} from '../../../engine/social/instagramEngine';
import { GameState } from '../../../types/game';
import { InstagramPostTheme } from '../../../types/social';

interface InstagramAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

const THEME_GRADIENT: Record<InstagramPostTheme, string> = {
  victory: 'from-amber-600/35 via-blue-700/25 to-slate-900',
  training: 'from-blue-600/30 via-cyan-600/20 to-slate-900',
  lifestyle: 'from-pink-600/30 via-purple-600/20 to-slate-900',
  roster: 'from-indigo-600/30 via-violet-600/20 to-slate-900',
  sponsor: 'from-emerald-600/30 via-teal-600/20 to-slate-900',
  behind_scenes: 'from-slate-700/40 via-blue-900/25 to-slate-950',
};

export const InstagramApp: React.FC<InstagramAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [tab, setTab] = useState<'FEED' | 'COLLABS'>('FEED');
  const [handleInput, setHandleInput] = useState(ps?.instagramAccount.handle ?? '@esports_pro');
  const [bioInput, setBioInput] = useState(ps?.instagramAccount.bio ?? '');
  const [caption, setCaption] = useState('');
  const [theme, setTheme] = useState<InstagramPostTheme>('training');
  const [imageLabel, setImageLabel] = useState('Scrim Room Grind');

  if (!ps) return null;
  const ig = ps.instagramAccount;

  const rep = Math.max(
    state.character.reputation,
    state.playerCareer?.attributes.reputation ?? 0,
    state.org.reputation
  );

  if (!ig.created) {
    return (
      <div className="p-6 flex flex-col justify-center h-full bg-[#0B0F17] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
          <Camera size={24} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Create Your Instagram Profile</h3>
          <p className="text-xs text-slate-400 mt-1">
            Build lifestyle authority, grow public popularity, and unlock paid brand collaborations.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateState(
              setupUserInstagramAccount(state, handleInput, bioInput),
              'Instagram profile launched!'
            );
          }}
          className="space-y-3"
        >
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-300">Handle</span>
            <input
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#111826] border border-slate-800 text-xs text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-300">Bio</span>
            <input
              type="text"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Pro gamer & brand builder"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#111826] border border-slate-800 text-xs text-white"
            />
          </label>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold"
          >
            Launch Instagram Account
          </button>
        </form>
      </div>
    );
  }

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    const { nextState, followerGain } = publishUserInstagramPost(state, caption, theme, imageLabel);
    onUpdateState(nextState, `Posted to Instagram (+${followerGain.toLocaleString()} followers).`);
    setCaption('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]">
      {/* Profile & Tabs */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0E1420] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-white">{ig.displayName}</div>
            <div className="text-[11px] text-slate-400">
              {ig.handle} · {ig.followers.toLocaleString()} followers · {ig.postsCount} posts
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab('FEED')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold ${
                tab === 'FEED' ? 'bg-pink-600 text-white' : 'bg-[#141D2E] text-slate-300'
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => setTab('COLLABS')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold ${
                tab === 'COLLABS' ? 'bg-pink-600 text-white' : 'bg-[#141D2E] text-slate-300'
              }`}
            >
              Brand Collabs
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'FEED' ? (
          <>
            <form
              onSubmit={handlePost}
              className="rounded-2xl bg-[#111826] border border-slate-800 p-3.5 space-y-2.5"
            >
              <div className="text-xs font-display font-bold text-white">Share Moment</div>
              <input
                type="text"
                maxLength={220}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as InstagramPostTheme)}
                  className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-slate-200"
                >
                  <option value="training">Training Grind</option>
                  <option value="victory">Victory Shot</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="behind_scenes">Behind the Scenes</option>
                </select>
                <input
                  type="text"
                  maxLength={40}
                  value={imageLabel}
                  onChange={(e) => setImageLabel(e.target.value)}
                  placeholder="Scene label"
                  className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                disabled={!caption.trim()}
                className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 disabled:opacity-40 text-white text-xs font-semibold"
              >
                Publish Post
              </button>
            </form>

            {ps.instagramPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl bg-[#111826] border border-slate-800 overflow-hidden"
              >
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: post.avatarColor }}
                    >
                      {post.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{post.authorName}</div>
                      <div className="text-[10px] text-slate-400">
                        {post.authorHandle} · Wk {post.gameWeek}
                      </div>
                    </div>
                  </div>
                  {post.sponsoredBrand && (
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Paid Partner · {post.sponsoredBrand}
                    </span>
                  )}
                </div>

                {/* Stylized Photo Frame */}
                <div
                  className={`h-36 bg-gradient-to-br ${THEME_GRADIENT[post.theme]} border-y border-slate-800/80 flex flex-col items-center justify-center p-4 text-center`}
                >
                  <Trophy size={24} className="text-white/70 mb-1.5" />
                  <div className="font-display font-bold text-sm text-white">
                    {post.imageLabel}
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateState(toggleLikeInstagramPost(state, post.id))}
                      className={`inline-flex items-center gap-1.5 font-mono ${
                        post.likedByUser ? 'text-rose-400' : 'text-slate-300 hover:text-rose-400'
                      }`}
                    >
                      <Heart size={15} className={post.likedByUser ? 'fill-current' : ''} />
                      {post.likes.toLocaleString()}
                    </button>
                    <span className="font-mono text-slate-400">
                      {post.commentsCount.toLocaleString()} comments
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong className="text-white mr-1.5">{post.authorHandle}</strong>
                    {post.caption}
                  </p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-3">
            {ps.brandCollabOffers.map((offer) => {
              const eligible = ig.followers >= offer.minFollowers && rep >= offer.minReputation;
              return (
                <div
                  key={offer.id}
                  className="rounded-2xl bg-[#111826] border border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={13} className="text-pink-400" />
                        {offer.brandName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {offer.industry} · Min {offer.minFollowers.toLocaleString()} followers · Rep{' '}
                        {offer.minReputation}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-400">
                      +${offer.payoutUSD.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">&ldquo;{offer.captionPrompt}&rdquo;</p>
                  <button
                    type="button"
                    disabled={offer.status !== 'available' || !eligible}
                    onClick={() => {
                      const { nextState, payoutUSD } = publishUserInstagramPost(
                        state,
                        offer.captionPrompt,
                        'sponsor',
                        `Collab · ${offer.brandName}`,
                        offer.id
                      );
                      onUpdateState(
                        nextState,
                        `Completed ${offer.brandName} brand post (+$${payoutUSD.toLocaleString()})!`
                      );
                      setTab('FEED');
                    }}
                    className="w-full min-h-[40px] rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    {offer.status === 'completed'
                      ? 'Campaign Completed'
                      : eligible
                      ? 'Publish Paid Collab'
                      : 'Requirements Not Met'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
