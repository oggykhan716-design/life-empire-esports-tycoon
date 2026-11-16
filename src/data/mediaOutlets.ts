import { TwitterAccount, YouTubeChannel } from '../types/social';

export interface NewsOutletConfig {
  id: 'esports_amaze' | 'cheems_bond' | 'lets_never_grow';
  name: string;
  handle: string;
  tagline: string;
  tone: 'professional' | 'meme' | 'commentary';
  avatarColor: string;
  followers: number;
}

export const NEWS_OUTLETS: NewsOutletConfig[] = [
  {
    id: 'esports_amaze',
    name: 'EsportsAmaze',
    handle: '@EsportsAmaze',
    tagline: 'Verified global tournament reporting, roster wires, and championship coverage.',
    tone: 'professional',
    avatarColor: '#2563EB',
    followers: 485000,
  },
  {
    id: 'cheems_bond',
    name: 'CheemsBond',
    handle: '@CheemsBondGG',
    tagline: 'Meme-first esports chaos, viral clips, and zero chill after upsets.',
    tone: 'meme',
    avatarColor: '#F59E0B',
    followers: 390000,
  },
  {
    id: 'lets_never_grow',
    name: 'LetsNeverGrowEsports',
    handle: '@LetsNeverGrow',
    tagline: 'Critical industry commentary, management scrutiny, and community debates.',
    tone: 'commentary',
    avatarColor: '#DC2626',
    followers: 274000,
  },
];

export const MEDIA_TWITTER_ACCOUNTS: TwitterAccount[] = NEWS_OUTLETS.map((o) => ({
  id: `media_${o.id}`,
  handle: o.handle,
  displayName: o.name,
  category: 'MEDIA',
  bio: o.tagline,
  avatarColor: o.avatarColor,
  verified: true,
  followers: o.followers,
  following: true,
  personality: o.tone,
  postingFrequency: 1,
}));

export const INITIAL_YOUTUBE_MEDIA_CHANNELS: YouTubeChannel[] = [
  {
    id: 'yt_cg_talk',
    name: 'CG TALK',
    handle: '@CGTalkEsports',
    isUserOwned: false,
    subscribers: 640000,
    totalViews: 48200000,
    reputation: 88,
    created: true,
  },
  {
    id: 'yt_gamingnews15k',
    name: 'GamingNews15K',
    handle: '@GamingNews15K',
    isUserOwned: false,
    subscribers: 415000,
    totalViews: 31900000,
    reputation: 82,
    created: true,
  },
];
