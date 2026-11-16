import { GameState, PhoneState } from '../../types/game';
import { PhoneNotification } from '../../types/phone';
import { buildBankAccounts } from '../economy/bankEngine';
import { createInitialStockMarket } from '../economy/stocksEngine';
import {
  createInitialBrandCollabs,
  createInitialInstagramAccount,
  createInitialInstagramPosts,
} from '../social/instagramEngine';
import { createInitialConversations } from '../social/messengerEngine';
import { createInitialNewsArticles } from '../social/newsEngine';
import { buildInitialTwitterAccounts, computeTrendingTopics } from '../social/twitterEngine';
import {
  createInitialYouTubeChannels,
  createInitialYouTubeVideos,
} from '../social/youtubeEngine';
import { EventImportance, WorldEvent, WorldEventType } from './types';

export function createInitialPhoneState(state: GameState): PhoneState {
  const { conversations, messages } = createInitialConversations(state);
  const igAccount = createInitialInstagramAccount(state);
  const news = createInitialNewsArticles(state.week);
  const twitterAccounts = buildInitialTwitterAccounts(state);
  const stockMarket = createInitialStockMarket(state.rivals, state.org, state.week, state.day ?? 1);
  const youtubeChannels = createInitialYouTubeChannels(state);
  const youtubeVideos = createInitialYouTubeVideos(state.week);

  return {
    activeApp: null,
    notifications: [
      {
        id: 'notif_welcome_phone',
        appId: 'messenger',
        title: 'New Message',
        message:
          state.careerType === 'PLAYER'
            ? 'Marcus Vale (Esports Agent) sent you a welcome note.'
            : 'Elena Vance (League Ops) sent your opening briefing.',
        timestamp: Date.now(),
        gameWeek: state.week,
        gameDay: state.day ?? 1,
        isRead: false,
      },
    ],
    conversations,
    messages,
    news,
    twitterAccounts,
    tweets: [],
    trendingTopics: computeTrendingTopics([]),
    instagramAccount: igAccount,
    instagramPosts: createInitialInstagramPosts(state),
    brandCollabOffers: createInitialBrandCollabs(igAccount.followers, state.character.reputation),
    youtubeChannels,
    youtubeVideos,
    bankAccounts: buildBankAccounts(state),
    transactions: [],
    stockMarket,
  };
}

/**
 * Ensures PhoneState exists and reflects current org/account ownership without duplicating history.
 */
export function ensurePhoneState(state: GameState): GameState {
  const existing = state.phoneState;
  if (!existing) {
    return {
      ...state,
      schemaVersion: state.schemaVersion ?? 2,
      careerType: state.careerType ?? 'OWNER',
      randomSeed: state.randomSeed ?? Math.floor(Date.now() % 1_000_000_000),
      eventHistory: state.eventHistory ?? [],
      processedEventIds: state.processedEventIds ?? [],
      phoneState: createInitialPhoneState(state),
    };
  }

  // Keep bank accounts & org Twitter account synced if player founded an org later
  const bankAccounts = buildBankAccounts(state);
  let twitterAccounts = existing.twitterAccounts;
  if (state.org.founded && !twitterAccounts.some((a) => a.id === 'org_player_org')) {
    twitterAccounts = [
      {
        id: 'org_player_org',
        handle: `@${(state.org.tag || 'ORG').toUpperCase()}_Esports`,
        displayName: state.org.name,
        category: 'ORG',
        bio: `Official esports account of ${state.org.name} · HQ: ${state.org.headquarters}`,
        avatarColor: state.org.color || '#2563EB',
        verified: true,
        followers: Math.max(1200, state.org.followers),
        following: true,
        orgId: 'player_org',
      },
      ...twitterAccounts,
    ];
  }

  return {
    ...state,
    schemaVersion: state.schemaVersion ?? 2,
    careerType: state.careerType ?? 'OWNER',
    randomSeed: state.randomSeed ?? 421907,
    eventHistory: state.eventHistory ?? [],
    processedEventIds: state.processedEventIds ?? [],
    phoneState: {
      ...existing,
      bankAccounts,
      twitterAccounts,
    },
  };
}

export function createWorldEvent(
  state: GameState,
  params: {
    id?: string;
    type: WorldEventType;
    actorId?: string;
    targetId?: string;
    title: string;
    description: string;
    payload?: Record<string, unknown>;
    importance?: EventImportance;
    timestamp?: number;
  }
): WorldEvent {
  const gameWeek = state.week;
  const gameDay = state.day ?? 1;
  const seq = (state.eventHistory?.length ?? 0) + 1;
  return {
    id:
      params.id ??
      `wevt_${params.type}_${gameWeek}_${gameDay}_${seq}_${params.actorId ?? 'world'}`,
    type: params.type,
    timestamp: params.timestamp ?? Date.now(),
    gameWeek,
    gameDay,
    actorId: params.actorId,
    targetId: params.targetId,
    title: params.title,
    description: params.description,
    payload: params.payload ?? {},
    importance: params.importance ?? 'MEDIUM',
  };
}

export function markAllPhoneNotificationsRead(state: GameState): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      notifications: state.phoneState.notifications.map((n) => ({ ...n, isRead: true })),
    },
  };
}

export function markAppNotificationsRead(state: GameState, appId: PhoneNotification['appId']): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      notifications: state.phoneState.notifications.map((n) =>
        n.appId === appId ? { ...n, isRead: true } : n
      ),
    },
  };
}
