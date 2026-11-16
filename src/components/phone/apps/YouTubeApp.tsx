import React, { useState } from 'react';
import { Eye, Play, ThumbsUp, Tv, Upload } from 'lucide-react';
import {
  createUserYouTubeChannel,
  uploadUserYouTubeVideo,
} from '../../../engine/social/youtubeEngine';
import { GameState } from '../../../types/game';
import { YouTubeCategory } from '../../../types/social';

interface YouTubeAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

const CATEGORIES: YouTubeCategory[] = [
  'Tournament Analysis',
  'Match Highlights',
  'Player Vlog',
  'Drama & News',
  'Pro Tips & Guides',
  'Sponsor Spotlight',
];

export const YouTubeApp: React.FC<YouTubeAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [tab, setTab] = useState<'FEED' | 'CHANNELS' | 'STUDIO'>('FEED');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [newChannelName, setNewChannelName] = useState(
    state.careerType === 'PLAYER' && state.playerCareer?.ign
      ? `${state.playerCareer.ign} Official`
      : `${state.character.firstName} Esports TV`
  );
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState<YouTubeCategory>('Match Highlights');

  if (!ps) return null;

  const userCh = ps.youtubeChannels.find((c) => c.isUserOwned);
  const filteredVideos = ps.youtubeVideos.filter(
    (v) => channelFilter === 'ALL' || v.channelId === channelFilter
  );

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    onUpdateState(
      createUserYouTubeChannel(state, newChannelName),
      `Launched YouTube channel "${newChannelName.trim()}"!`
    );
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;
    const { nextState, video, milestone100k } = uploadUserYouTubeVideo(
      state,
      videoTitle,
      videoCategory
    );
    if (video) {
      onUpdateState(
        nextState,
        `Uploaded "${video.title}": ${video.views.toLocaleString()} views (+$${video.revenue.toLocaleString()})${
          milestone100k ? ' · 100K Milestone!' : ''
        }`
      );
      setVideoTitle('');
      setTab('FEED');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]">
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-[#0E1420] flex items-center gap-1.5">
        {(
          [
            { id: 'FEED', label: 'Watch Feed' },
            { id: 'CHANNELS', label: 'Channels' },
            { id: 'STUDIO', label: 'My Studio' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id === 'FEED') setChannelFilter('ALL');
            }}
            className={`flex-1 min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold ${
              tab === t.id ? 'bg-red-600 text-white' : 'bg-[#141D2E] text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {tab === 'FEED' && (
          <>
            {channelFilter !== 'ALL' && (
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  Channel:{' '}
                  <strong>
                    {ps.youtubeChannels.find((c) => c.id === channelFilter)?.name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setChannelFilter('ALL')}
                  className="text-red-400 underline"
                >
                  Show all videos
                </button>
              </div>
            )}

            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                className="rounded-2xl bg-[#111826] border border-slate-800 overflow-hidden"
              >
                <div className="h-28 bg-gradient-to-br from-red-900/35 via-[#131B2E] to-slate-950 border-b border-slate-800/80 p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="text-[11px] font-semibold text-red-400">
                      {vid.channelName} · {vid.category}
                    </div>
                    <h4 className="font-display font-bold text-sm text-white line-clamp-2 leading-snug">
                      {vid.title}
                    </h4>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shrink-0">
                    <Play size={16} className="ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} />
                    {vid.views.toLocaleString()} views
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp size={13} />
                    {vid.likes.toLocaleString()}
                  </span>
                  <span>Wk {vid.gameWeek}</span>
                  {vid.revenue > 0 && vid.channelId === 'yt_user_channel' && (
                    <span className="text-emerald-400 font-semibold">
                      +${vid.revenue.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'CHANNELS' && (
          <div className="space-y-3">
            {ps.youtubeChannels.map((ch) => (
              <div
                key={ch.id}
                className="rounded-2xl bg-[#111826] border border-slate-800 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                    <Tv size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {ch.name}{' '}
                      {ch.isUserOwned && <span className="text-blue-400">(You)</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {ch.handle} · {ch.subscribers.toLocaleString()} subscribers
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChannelFilter(ch.id);
                    setTab('FEED');
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#182236] hover:bg-slate-800 text-xs font-semibold text-white shrink-0"
                >
                  Videos
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'STUDIO' && (
          <>
            {!userCh?.created ? (
              <form
                onSubmit={handleCreateChannel}
                className="rounded-2xl bg-[#111826] border border-slate-800 p-5 space-y-3"
              >
                <div className="font-display font-bold text-sm text-white">
                  Launch Your Esports YouTube Channel
                </div>
                <p className="text-xs text-slate-400">
                  Publish highlights, tactical breakdowns, and player vlogs to earn ad revenue directly into your Personal Bank.
                </p>
                <input
                  type="text"
                  maxLength={32}
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full min-h-[42px] rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  Create Channel
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#111826] border border-slate-800 p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[11px] text-slate-400">Subscribers</div>
                    <div className="font-mono text-sm font-bold text-white">
                      {userCh.subscribers.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Total Views</div>
                    <div className="font-mono text-sm font-bold text-red-400">
                      {userCh.totalViews.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Channel Rep</div>
                    <div className="font-mono text-sm font-bold text-blue-400">
                      {userCh.reputation}/100
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleUpload}
                  className="rounded-2xl bg-[#111826] border border-slate-800 p-4 space-y-3"
                >
                  <div className="font-display font-bold text-xs text-white flex items-center gap-1.5">
                    <Upload size={14} className="text-red-400" />
                    Upload New Video
                  </div>
                  <input
                    type="text"
                    maxLength={90}
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. HOW WE WON THE MAJOR QUALIFIERS (FULL COMMS)"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white"
                  />
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value as YouTubeCategory)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!videoTitle.trim()}
                    className="w-full min-h-[42px] rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Publish &amp; Monetize
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
