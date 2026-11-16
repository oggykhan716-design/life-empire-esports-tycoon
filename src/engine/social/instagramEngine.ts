import { GameState } from '../../types/game';
import {
  BrandCollabOffer,
  InstagramAccount,
  InstagramPostTheme,
  SocialPost,
} from '../../types/social';
import { appendBankTransaction } from '../economy/bankEngine';
import { WorldEvent } from '../events/types';

const MAX_INSTAGRAM_POSTS = 150;

export function createInitialInstagramAccount(state: GameState): InstagramAccount {
  const cleanHandle =
    state.careerType === 'PLAYER' && state.playerCareer?.ign
      ? state.playerCareer.ign.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : `${state.character.firstName}${state.character.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');

  return {
    created: state.careerType === 'PLAYER' || Boolean(state.org.founded),
    handle: `@${cleanHandle || 'esports_pro'}`,
    displayName:
      state.careerType === 'PLAYER' && state.playerCareer?.ign
        ? state.playerCareer.ign
        : `${state.character.firstName} ${state.character.lastName}`,
    bio:
      state.careerType === 'PLAYER'
        ? `Competitive gamer · Grinding daily`
        : `Esports Founder & Executive`,
    followers: 85 + state.character.connections * 14,
    postsCount: 0,
    lastPostedWeek: 0,
  };
}

export function createInitialBrandCollabs(followers: number, reputation: number): BrandCollabOffer[] {
  return [
    {
      id: 'ig_collab_volt',
      brandName: 'VoltPulse Energy',
      industry: 'Beverages',
      payoutUSD: 350,
      minFollowers: 200,
      minReputation: 5,
      captionPrompt: 'Fueling late-night scrim blocks with @VoltPulseEnergy.',
      status: 'available',
    },
    {
      id: 'ig_collab_kinetix',
      brandName: 'Kinetix Gear',
      industry: 'Peripherals',
      payoutUSD: 1100,
      minFollowers: 1500,
      minReputation: 20,
      captionPrompt: 'Zero latency, dialed-in aim with the new @KinetixGear pro mouse.',
      status: 'available',
    },
    {
      id: 'ig_collab_stratos',
      brandName: 'Stratos Seating',
      industry: 'Ergonomics',
      payoutUSD: 2800,
      minFollowers: 8000,
      minReputation: 42,
      captionPrompt: 'Stage comfort starts at home. Proud to rep @StratosSeating.',
      status: 'available',
    },
    {
      id: 'ig_collab_aether',
      brandName: 'Aether Lifestyle',
      industry: 'Apparel',
      payoutUSD: 7500 + (followers > 50000 && reputation > 70 ? 2500 : 0),
      minFollowers: 30000,
      minReputation: 65,
      captionPrompt: 'Matchday drip powered by @AetherLifestyle.',
      status: 'available',
    },
  ];
}

export function createInitialInstagramPosts(state: GameState): SocialPost[] {
  return [
    {
      id: 'ig_init_titan',
      authorId: 'org_titan_esports',
      authorHandle: '@TitanEsports',
      authorName: 'Titan Esports',
      authorType: 'ORG',
      avatarColor: '#1D4ED8',
      caption: 'Season bootcamp in full swing. Locked in for championship hardware.',
      theme: 'behind_scenes',
      imageLabel: 'Bootcamp Setup · Los Angeles',
      likes: 18420,
      commentsCount: 412,
      likedByUser: false,
      publishedAt: Date.now() - 50000000,
      gameWeek: state.week,
    },
    {
      id: 'ig_init_nova',
      authorId: 'org_nova_gaming',
      authorHandle: '@NovaGaming',
      authorName: 'Nova Gaming',
      authorType: 'ORG',
      avatarColor: '#0F766E',
      caption: 'Introducing our academy class for the upcoming split.',
      theme: 'roster',
      imageLabel: 'Roster Reveal · Seoul Arena',
      likes: 14190,
      commentsCount: 309,
      likedByUser: false,
      publishedAt: Date.now() - 25000000,
      gameWeek: state.week,
    },
  ];
}

export function applyEventToInstagram(
  existingPosts: SocialPost[],
  event: WorldEvent,
  rng: () => number
): SocialPost[] {
  if (existingPosts.some((p) => p.relatedEventId === event.id)) {
    return existingPosts;
  }

  const p = event.payload;
  const teamName = String(p.teamName ?? p.orgName ?? 'Esports Club');
  const handle = `@${teamName.replace(/[^a-zA-Z0-9]/g, '')}`;
  const oppName = String(p.opponentName ?? 'Opponents');
  const scoreLine = String(p.scoreLine ?? '2–1');
  const tournamentName = String(p.tournamentName ?? 'Championship');
  const playerIgn = String(p.playerIgn ?? p.mvpIgn ?? '');
  const brand = String(p.brandName ?? 'Partner');
  const color = String(p.orgColor ?? '#2563EB');

  const created: SocialPost[] = [];

  if (event.type === 'TOURNAMENT_COMPLETED' && p.won !== false) {
    created.push({
      id: `ig_${event.id}_1`,
      authorId: event.actorId ?? 'org',
      authorHandle: handle,
      authorName: teamName,
      authorType: 'ORG',
      avatarColor: color,
      caption: `CHAMPIONS OF ${tournamentName.toUpperCase()}! Closed out ${oppName} ${scoreLine}. Thank you to every fan who believed.`,
      theme: 'victory',
      imageLabel: `Trophy Lift · ${tournamentName}`,
      likes: Math.round(4500 + rng() * 18000),
      commentsCount: Math.round(140 + rng() * 520),
      likedByUser: false,
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  } else if (event.type === 'PLAYER_SIGNED') {
    created.push({
      id: `ig_${event.id}_1`,
      authorId: event.actorId ?? 'org',
      authorHandle: handle,
      authorName: teamName,
      authorType: 'ORG',
      avatarColor: color,
      caption: `Welcome to the family, ${playerIgn}! Ready to dominate the server together.`,
      theme: 'roster',
      imageLabel: `Official Signing · ${playerIgn}`,
      likes: Math.round(2800 + rng() * 11000),
      commentsCount: Math.round(90 + rng() * 340),
      likedByUser: false,
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  } else if (event.type === 'SPONSORSHIP_SIGNED') {
    created.push({
      id: `ig_${event.id}_1`,
      authorId: event.actorId ?? 'org',
      authorHandle: handle,
      authorName: teamName,
      authorType: 'ORG',
      avatarColor: color,
      caption: `Excited to unveil ${brand} as an official partner of ${teamName}!`,
      theme: 'sponsor',
      imageLabel: `Brand Partnership · ${brand}`,
      likes: Math.round(2200 + rng() * 8000),
      commentsCount: Math.round(60 + rng() * 180),
      likedByUser: false,
      publishedAt: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  return [...created.slice(0, 2), ...existingPosts].slice(0, MAX_INSTAGRAM_POSTS);
}

export function setupUserInstagramAccount(
  state: GameState,
  handle: string,
  bio: string
): GameState {
  if (!state.phoneState) return state;
  const clean = handle.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '');
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      instagramAccount: {
        ...state.phoneState.instagramAccount,
        created: true,
        handle: `@${clean || 'esports_star'}`,
        bio: bio.trim() || state.phoneState.instagramAccount.bio,
      },
    },
  };
}

export function publishUserInstagramPost(
  state: GameState,
  caption: string,
  theme: InstagramPostTheme,
  imageLabel: string,
  collabId?: string
): { nextState: GameState; followerGain: number; payoutUSD: number } {
  if (!state.phoneState || !caption.trim()) {
    return { nextState: state, followerGain: 0, payoutUSD: 0 };
  }

  const ig = state.phoneState.instagramAccount;
  const rep = Math.max(
    state.character.reputation,
    state.playerCareer?.attributes.reputation ?? 0,
    state.org.reputation
  );

  // Diminishing returns if posting multiple times in the same week
  const sameWeekPenalty = ig.lastPostedWeek === state.week ? 0.25 : 1.0;
  const baseGain = 35 + rep * 6 + Math.round(ig.followers * 0.035);
  const followerGain = Math.min(2500, Math.max(8, Math.round(baseGain * sameWeekPenalty)));

  let payoutUSD = 0;
  let sponsoredBrand: string | undefined;
  let nextCollabs = state.phoneState.brandCollabOffers;

  if (collabId) {
    const offer = nextCollabs.find((c) => c.id === collabId && c.status === 'available');
    if (offer && ig.followers >= offer.minFollowers && rep >= offer.minReputation) {
      payoutUSD = offer.payoutUSD;
      sponsoredBrand = offer.brandName;
      nextCollabs = nextCollabs.map((c) =>
        c.id === collabId ? { ...c, status: 'completed' as const } : c
      );
    }
  }

  const likes = Math.max(
    18,
    Math.round((ig.followers * 0.14 + rep * 8) * (0.85 + Math.random() * 0.35))
  );

  const post: SocialPost = {
    id: `ig_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorId: 'user_self',
    authorHandle: ig.handle,
    authorName: ig.displayName,
    authorType: 'USER',
    avatarColor: '#EC4899',
    caption: caption.trim(),
    theme,
    imageLabel: imageLabel.trim() || 'Matchday Snapshot',
    likes,
    commentsCount: Math.round(likes * 0.06),
    likedByUser: false,
    sponsoredBrand,
    publishedAt: Date.now(),
    gameWeek: state.week,
  };

  let nextTransactions = state.phoneState.transactions;
  if (payoutUSD > 0) {
    nextTransactions = appendBankTransaction(nextTransactions, {
      accountId: 'personal_bank',
      type: 'INCOME',
      category: 'Instagram Collab',
      amount: payoutUSD,
      description: `Paid brand collaboration with ${sponsoredBrand}`,
      timestamp: Date.now(),
      gameWeek: state.week,
    });
  }

  const nextState: GameState = {
    ...state,
    character: {
      ...state.character,
      reputation: Math.min(100, state.character.reputation + (sameWeekPenalty >= 1 ? 1 : 0)),
    },
    playerCareer: state.playerCareer
      ? {
          ...state.playerCareer,
          attributes: {
            ...state.playerCareer.attributes,
            popularity: Math.min(
              100,
              state.playerCareer.attributes.popularity + (sameWeekPenalty >= 1 ? 2 : 0)
            ),
          },
        }
      : undefined,
    finances: {
      ...state.finances,
      bankBalanceUSD: state.finances.bankBalanceUSD + payoutUSD,
      lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + payoutUSD,
    },
    phoneState: {
      ...state.phoneState,
      instagramAccount: {
        ...ig,
        created: true,
        followers: ig.followers + followerGain,
        postsCount: ig.postsCount + 1,
        lastPostedWeek: state.week,
      },
      instagramPosts: [post, ...state.phoneState.instagramPosts].slice(0, MAX_INSTAGRAM_POSTS),
      brandCollabOffers: nextCollabs,
      transactions: nextTransactions,
    },
  };

  return { nextState, followerGain, payoutUSD };
}

export function toggleLikeInstagramPost(state: GameState, postId: string): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      instagramPosts: state.phoneState.instagramPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByUser: !p.likedByUser,
              likes: p.likedByUser ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p
      ),
    },
  };
}
