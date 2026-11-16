import { GameState } from '../../types/game';
import { PhoneNotification } from '../../types/phone';
import { applyEventToBank } from '../economy/bankEngine';
import { applyEventToStocks } from '../economy/stocksEngine';
import { applyEventToInstagram } from '../social/instagramEngine';
import { applyEventToMessenger } from '../social/messengerEngine';
import { applyEventToNews } from '../social/newsEngine';
import { applyEventToTwitter } from '../social/twitterEngine';
import { applyEventToYouTube } from '../social/youtubeEngine';
import { ensurePhoneState } from './eventBus';
import { createSeededRng, hashString, WorldEvent } from './types';

const MAX_EVENT_HISTORY = 200;
const MAX_PROCESSED_IDS = 400;
const MAX_NOTIFICATIONS = 60;

function generateNotificationForEvent(
  event: WorldEvent,
  state: GameState
): PhoneNotification | null {
  const isPlayerInvolved =
    event.actorId === 'player_org' ||
    event.actorId === 'user_player' ||
    event.targetId === 'player_org' ||
    event.payload.notifyUser === true;

  if (!isPlayerInvolved && event.importance !== 'HIGH') {
    return null;
  }

  let appId: PhoneNotification['appId'] = 'news';
  if (event.type === 'TOURNAMENT_PRIZE_RECEIVED' || event.type === 'SALARY_PAID' || event.type === 'SPONSORSHIP_PAYMENT_RECEIVED') {
    appId = 'bank';
  } else if (event.type === 'VIDEO_REVENUE_RECEIVED') {
    appId = 'youtube';
  } else if (event.type === 'STOCK_PRICE_UPDATED') {
    appId = 'stocks';
  } else if (event.type === 'ORGANISATION_TRENDING' || event.type === 'PLAYER_TRENDING') {
    appId = 'twitter';
  } else if (event.type === 'TOURNAMENT_COMPLETED') {
    appId = event.actorId === 'player_org' ? 'twitter' : 'news';
  } else if (event.type === 'PLAYER_SIGNED' && event.actorId === 'player_org') {
    appId = 'messenger';
  }

  return {
    id: `notif_${event.id}`,
    appId,
    title: event.title,
    message: event.description,
    timestamp: event.timestamp,
    gameWeek: event.gameWeek,
    gameDay: event.gameDay,
    isRead: false,
    relatedEventId: event.id,
  };
}

/**
 * Central World Event Processor.
 * Guarantees:
 * 1. Deduplication via processedEventIds (reload/retry never duplicates transactions or posts).
 * 2. Deterministic content generation seeded by game randomSeed + event.id.
 * 3. No infinite event loops (listeners produce pure state projections, never emit further events).
 */
export function processWorldEvents(state: GameState, incomingEvents: WorldEvent[]): GameState {
  if (incomingEvents.length === 0) return state;

  let cur = ensurePhoneState(state);
  const processedSet = new Set(cur.processedEventIds ?? []);
  const phone = cur.phoneState!;

  let nextTransactions = phone.transactions;
  let nextStockMarket = phone.stockMarket;
  let nextTweets = phone.tweets;
  let nextTwitterAccounts = phone.twitterAccounts;
  let nextTrendingTopics = phone.trendingTopics;
  let nextNews = phone.news;
  let nextIgPosts = phone.instagramPosts;
  let nextYtChannels = phone.youtubeChannels;
  let nextYtVideos = phone.youtubeVideos;
  let nextConversations = phone.conversations;
  let nextMessages = phone.messages;
  const nextNotifications = [...phone.notifications];
  const acceptedEvents: WorldEvent[] = [];

  for (const event of incomingEvents) {
    if (!event.id || processedSet.has(event.id)) {
      continue;
    }
    processedSet.add(event.id);
    acceptedEvents.push(event);

    const rng = createSeededRng(
      hashString(`${cur.randomSeed ?? 421907}:${event.id}:${event.gameWeek}:${event.gameDay}`)
    );

    // 1. Bank listener
    nextTransactions = applyEventToBank(nextTransactions, event);

    // 2. Team Stocks listener
    nextStockMarket = applyEventToStocks(nextStockMarket, event, rng);

    // 3. Twitter listener
    const twRes = applyEventToTwitter(nextTwitterAccounts, nextTweets, event, rng);
    nextTweets = twRes.tweets;
    nextTwitterAccounts = twRes.accounts;
    nextTrendingTopics = twRes.trendingTopics;

    // 4. News listener
    nextNews = applyEventToNews(nextNews, event, rng);

    // 5. Instagram listener
    nextIgPosts = applyEventToInstagram(nextIgPosts, event, rng);

    // 6. YouTube listener
    const ytRes = applyEventToYouTube(nextYtChannels, nextYtVideos, event, rng);
    nextYtChannels = ytRes.channels;
    nextYtVideos = ytRes.videos;

    // 7. Messenger listener
    const msgRes = applyEventToMessenger(nextConversations, nextMessages, event, cur);
    nextConversations = msgRes.conversations;
    nextMessages = msgRes.messages;

    // 8. Phone notification
    const notif = generateNotificationForEvent(event, cur);
    if (notif && !nextNotifications.some((n) => n.id === notif.id)) {
      nextNotifications.unshift(notif);
    }
  }

  if (acceptedEvents.length === 0) {
    return cur;
  }

  const nextEventHistory = [...acceptedEvents.reverse(), ...(cur.eventHistory ?? [])].slice(
    0,
    MAX_EVENT_HISTORY
  );
  const nextProcessedIds = Array.from(processedSet).slice(-MAX_PROCESSED_IDS);

  return {
    ...cur,
    eventHistory: nextEventHistory,
    processedEventIds: nextProcessedIds,
    phoneState: {
      ...phone,
      notifications: nextNotifications.slice(0, MAX_NOTIFICATIONS),
      transactions: nextTransactions,
      stockMarket: nextStockMarket,
      tweets: nextTweets,
      twitterAccounts: nextTwitterAccounts,
      trendingTopics: nextTrendingTopics,
      news: nextNews,
      instagramPosts: nextIgPosts,
      youtubeChannels: nextYtChannels,
      youtubeVideos: nextYtVideos,
      conversations: nextConversations,
      messages: nextMessages,
    },
  };
}
