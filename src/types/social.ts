export type TwitterAccountCategory = 'ORG' | 'MEDIA' | 'PARODY' | 'PLAYER' | 'USER';

export interface TwitterAccount {
  id: string;
  handle: string;
  displayName: string;
  category: TwitterAccountCategory;
  bio: string;
  avatarColor: string;
  verified: boolean;
  followers: number;
  following: boolean;
  personality?: string;
  postingFrequency?: number; // 0..1
  preferredOrgIds?: string[];
  rivalOrgIds?: string[];
  favoritePlayerNames?: string[];
  orgId?: string;
  playerId?: string;
}

export interface TweetReply {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  likes: number;
  publishedAt: number;
  gameWeek: number;
}

export interface Tweet {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorCategory: TwitterAccountCategory;
  verified: boolean;
  avatarColor: string;
  content: string;
  hashtags: string[];
  likes: number;
  reposts: number;
  repliesCount: number;
  views: number;
  engagementScore: number;
  likedByUser: boolean;
  repostedByUser: boolean;
  replies: TweetReply[];
  publishedAt: number;
  gameWeek: number;
  gameDay: number;
  relatedEventId?: string;
}

export type NewsCategory =
  | 'Breaking News'
  | 'Tournament Results'
  | 'Transfer News'
  | 'Organisation News'
  | 'Player Profiles'
  | 'Controversies'
  | 'Financial Reports'
  | 'Community Discussions';

export interface NewsArticle {
  id: string;
  publisherId: 'esports_amaze' | 'cheems_bond' | 'lets_never_grow';
  publisherName: string;
  headline: string;
  summary: string;
  body: string;
  category: NewsCategory;
  relatedEventId: string;
  publishedAt: number;
  gameWeek: number;
  importance: number;
}

export type InstagramPostTheme =
  | 'victory'
  | 'roster'
  | 'training'
  | 'lifestyle'
  | 'sponsor'
  | 'behind_scenes';

export interface SocialPost {
  id: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorType: 'USER' | 'ORG' | 'PLAYER';
  avatarColor: string;
  caption: string;
  theme: InstagramPostTheme;
  imageLabel: string;
  likes: number;
  commentsCount: number;
  likedByUser: boolean;
  sponsoredBrand?: string;
  publishedAt: number;
  gameWeek: number;
  relatedEventId?: string;
}

export interface InstagramAccount {
  created: boolean;
  handle: string;
  displayName: string;
  bio: string;
  followers: number;
  postsCount: number;
  lastPostedWeek: number;
}

export interface BrandCollabOffer {
  id: string;
  brandName: string;
  industry: string;
  payoutUSD: number;
  minFollowers: number;
  minReputation: number;
  captionPrompt: string;
  status: 'available' | 'completed';
}

export interface YouTubeChannel {
  id: string;
  name: string;
  handle: string;
  isUserOwned: boolean;
  subscribers: number;
  totalViews: number;
  reputation: number;
  created: boolean;
  lastUploadedWeek?: number;
}

export type YouTubeCategory =
  | 'Tournament Analysis'
  | 'Match Highlights'
  | 'Player Vlog'
  | 'Drama & News'
  | 'Pro Tips & Guides'
  | 'Sponsor Spotlight';

export interface YouTubeVideo {
  id: string;
  channelId: string;
  channelName: string;
  title: string;
  category: YouTubeCategory;
  views: number;
  likes: number;
  comments: number;
  publishedAt: number;
  gameWeek: number;
  revenue: number;
  relatedEventId?: string;
}
