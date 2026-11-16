import { INITIAL_YOUTUBE_MEDIA_CHANNELS } from '../../data/mediaOutlets';
import { GameState } from '../../types/game';
import { YouTubeCategory, YouTubeChannel, YouTubeVideo } from '../../types/social';
import { appendBankTransaction } from '../economy/bankEngine';
import { WorldEvent } from '../events/types';

const MAX_VIDEOS = 100;

const RPM_BY_CATEGORY: Record<YouTubeCategory, number> = {
  'Tournament Analysis': 5.2,
  'Match Highlights': 4.1,
  'Player Vlog': 3.8,
  'Drama & News': 4.6,
  'Pro Tips & Guides': 5.5,
  'Sponsor Spotlight': 7.4,
};

export function createInitialYouTubeChannels(state: GameState): YouTubeChannel[] {
  const userName =
    state.careerType === 'PLAYER' && state.playerCareer?.ign
      ? `${state.playerCareer.ign} TV`
      : `${state.character.firstName} ${state.character.lastName}`;
  const cleanHandle = userName.replace(/[^a-zA-Z0-9]/g, '');

  return [
    ...INITIAL_YOUTUBE_MEDIA_CHANNELS.map((c) => ({ ...c })),
    {
      id: 'yt_user_channel',
      name: userName,
      handle: `@${cleanHandle || 'EsportsChannel'}`,
      isUserOwned: true,
      subscribers: 0,
      totalViews: 0,
      reputation: Math.max(10, state.character.reputation),
      created: false,
    },
  ];
}

export function createInitialYouTubeVideos(week = 1): YouTubeVideo[] {
  return [
    {
      id: 'yt_vid_init_1',
      channelId: 'yt_cg_talk',
      channelName: 'CG TALK',
      title: 'POWER RANKINGS: WHICH ORGANISATIONS CAN CHALLENGE TITAN ESPORTS THIS YEAR?',
      category: 'Tournament Analysis',
      views: 142800,
      likes: 11200,
      comments: 940,
      publishedAt: Date.now() - 45000000,
      gameWeek: week,
      revenue: 742,
    },
    {
      id: 'yt_vid_init_2',
      channelId: 'yt_gamingnews15k',
      channelName: 'GamingNews15K',
      title: 'TOP 5 RISING PLAYERS YOU NEED TO WATCH (KIWYOS YT, SPARKY, ADI GAMER)',
      category: 'Drama & News',
      views: 96400,
      likes: 8300,
      comments: 620,
      publishedAt: Date.now() - 25000000,
      gameWeek: week,
      revenue: 443,
    },
  ];
}

export function applyEventToYouTube(
  channels: YouTubeChannel[],
  existingVideos: YouTubeVideo[],
  event: WorldEvent,
  rng: () => number
): { channels: YouTubeChannel[]; videos: YouTubeVideo[] } {
  if (existingVideos.some((v) => v.relatedEventId === event.id)) {
    return { channels, videos: existingVideos };
  }

  if (event.importance === 'LOW') {
    return { channels, videos: existingVideos };
  }

  const p = event.payload;
  const teamName = String(p.teamName ?? p.orgName ?? 'Top Contenders');
  const oppName = String(p.opponentName ?? 'Rivals');
  const tournamentName = String(p.tournamentName ?? 'International Stage');
  const playerIgn = String(p.playerIgn ?? p.mvpIgn ?? 'Superstar');
  const won = Boolean(p.won);

  const created: YouTubeVideo[] = [];

  if (event.type === 'TOURNAMENT_COMPLETED') {
    const champ = won ? teamName : oppName;
    created.push({
      id: `yt_${event.id}_cg`,
      channelId: 'yt_cg_talk',
      channelName: 'CG TALK',
      title: `WHY ${champ.toUpperCase()} ARE BECOMING AN UNSTOPPABLE FORCE (${tournamentName.toUpperCase()})`,
      category: 'Tournament Analysis',
      views: Math.round(95000 + rng() * 210000),
      likes: Math.round(8000 + rng() * 19000),
      comments: Math.round(550 + rng() * 1600),
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      revenue: 0,
      relatedEventId: event.id,
    });
    created.push({
      id: `yt_${event.id}_gn`,
      channelId: 'yt_gamingnews15k',
      channelName: 'GamingNews15K',
      title: `${champ} Lift ${tournamentName} Trophy — Full Highlights & MVP Breakdown`,
      category: 'Match Highlights',
      views: Math.round(68000 + rng() * 145000),
      likes: Math.round(6200 + rng() * 12000),
      comments: Math.round(410 + rng() * 980),
      publishedAt: event.timestamp + 2000,
      gameWeek: event.gameWeek,
      revenue: 0,
      relatedEventId: event.id,
    });
  } else if (event.type === 'MATCH_COMPLETED' && event.importance === 'HIGH') {
    const winner = won ? teamName : oppName;
    created.push({
      id: `yt_${event.id}_cg`,
      channelId: 'yt_cg_talk',
      channelName: 'CG TALK',
      title: `${winner} Statement Win Over ${won ? oppName : teamName} — Tactical Breakdown`,
      category: 'Tournament Analysis',
      views: Math.round(58000 + rng() * 110000),
      likes: Math.round(5100 + rng() * 8800),
      comments: Math.round(350 + rng() * 720),
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      revenue: 0,
      relatedEventId: event.id,
    });
  } else if (event.type === 'PLAYER_SIGNED' || event.type === 'PLAYER_TRANSFERRED') {
    created.push({
      id: `yt_${event.id}_gn`,
      channelId: 'yt_gamingnews15k',
      channelName: 'GamingNews15K',
      title: `CONFIRMED: ${playerIgn} Signs With ${teamName} — Transfer Grade & Expectations`,
      category: 'Drama & News',
      views: Math.round(48000 + rng() * 95000),
      likes: Math.round(4200 + rng() * 7600),
      comments: Math.round(320 + rng() * 680),
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      revenue: 0,
      relatedEventId: event.id,
    });
  } else if (event.type === 'CONTROVERSY_CREATED' || event.type === 'ORGANISATION_BANKRUPTCY') {
    created.push({
      id: `yt_${event.id}_gn`,
      channelId: 'yt_gamingnews15k',
      channelName: 'GamingNews15K',
      title: `EXPLAINED: ${event.title}`,
      category: 'Drama & News',
      views: Math.round(78000 + rng() * 165000),
      likes: Math.round(6900 + rng() * 13000),
      comments: Math.round(900 + rng() * 2100),
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      revenue: 0,
      relatedEventId: event.id,
    });
  }

  return {
    channels,
    videos: [...created.slice(0, 3), ...existingVideos].slice(0, MAX_VIDEOS),
  };
}

export function createUserYouTubeChannel(state: GameState, channelName: string): GameState {
  if (!state.phoneState || !channelName.trim()) return state;
  const cleanName = channelName.trim().slice(0, 32);
  const cleanHandle = `@${cleanName.replace(/[^a-zA-Z0-9]/g, '') || 'EsportsCreator'}`;

  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      youtubeChannels: state.phoneState.youtubeChannels.map((ch) =>
        ch.isUserOwned
          ? {
              ...ch,
              name: cleanName,
              handle: cleanHandle,
              created: true,
              subscribers: Math.max(ch.subscribers, 100 + state.character.connections * 12),
            }
          : ch
      ),
    },
  };
}

export function uploadUserYouTubeVideo(
  state: GameState,
  title: string,
  category: YouTubeCategory
): { nextState: GameState; video: YouTubeVideo | null; milestone100k: boolean } {
  if (!state.phoneState || !title.trim()) {
    return { nextState: state, video: null, milestone100k: false };
  }
  const userCh = state.phoneState.youtubeChannels.find((c) => c.isUserOwned);
  if (!userCh || !userCh.created) {
    return { nextState: state, video: null, milestone100k: false };
  }

  const rep = Math.max(
    state.character.reputation,
    state.playerCareer?.attributes.reputation ?? 0,
    state.playerCareer?.attributes.popularity ?? 0,
    state.org.reputation
  );
  const sameWeekMultiplier = userCh.lastUploadedWeek === state.week ? 0.35 : 1.0;

  const baseViews = Math.round(
    (650 + userCh.subscribers * (0.28 + Math.random() * 0.35) + rep * 140) *
      sameWeekMultiplier
  );
  const views = Math.max(120, Math.min(850000, baseViews));
  const baseRpm = RPM_BY_CATEGORY[category];
  const rpm = baseRpm * (1 + Math.min(0.6, rep / 150));
  const revenue = Math.max(1, Math.round((views / 1000) * rpm));
  const likes = Math.round(views * (0.065 + Math.random() * 0.03));
  const comments = Math.round(likes * 0.09);
  const subGain = Math.min(
    18000,
    Math.max(12, Math.round((views * 0.024 + rep * 4) * sameWeekMultiplier))
  );

  const video: YouTubeVideo = {
    id: `yt_user_vid_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    channelId: userCh.id,
    channelName: userCh.name,
    title: title.trim().slice(0, 90),
    category,
    views,
    likes,
    comments,
    publishedAt: Date.now(),
    gameWeek: state.week,
    revenue,
  };

  const nextTransactions = appendBankTransaction(state.phoneState.transactions, {
    accountId: 'personal_bank',
    type: 'INCOME',
    category: 'YouTube AdSense',
    amount: revenue,
    description: `"${video.title}" (${views.toLocaleString()} views)`,
    timestamp: Date.now(),
    gameWeek: state.week,
  });

  const notifications = [...state.phoneState.notifications];
  const milestone100k = views >= 100000;
  if (milestone100k) {
    notifications.unshift({
      id: `notif_yt100k_${Date.now()}`,
      appId: 'youtube',
      title: 'Viral Video Milestone!',
      message: `Your latest upload "${video.title}" crossed ${views.toLocaleString()} views (+$${revenue.toLocaleString()}).`,
      timestamp: Date.now(),
      gameWeek: state.week,
      gameDay: state.day ?? 1,
      isRead: false,
    });
  }

  const nextState: GameState = {
    ...state,
    finances: {
      ...state.finances,
      bankBalanceUSD: state.finances.bankBalanceUSD + revenue,
      lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + revenue,
    },
    playerCareer: state.playerCareer
      ? {
          ...state.playerCareer,
          attributes: {
            ...state.playerCareer.attributes,
            popularity: Math.min(
              100,
              state.playerCareer.attributes.popularity + (sameWeekMultiplier >= 1 ? 2 : 0)
            ),
          },
        }
      : undefined,
    phoneState: {
      ...state.phoneState,
      youtubeChannels: state.phoneState.youtubeChannels.map((c) =>
        c.id === userCh.id
          ? {
              ...c,
              subscribers: c.subscribers + subGain,
              totalViews: c.totalViews + views,
              reputation: Math.min(100, c.reputation + 1),
              lastUploadedWeek: state.week,
            }
          : c
      ),
      youtubeVideos: [video, ...state.phoneState.youtubeVideos].slice(0, MAX_VIDEOS),
      transactions: nextTransactions,
      notifications: notifications.slice(0, 60),
    },
  };

  return { nextState, video, milestone100k };
}
