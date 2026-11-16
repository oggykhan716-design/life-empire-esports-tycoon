import { MEDIA_TWITTER_ACCOUNTS } from '../../data/mediaOutlets';
import { PARODY_ACCOUNTS } from '../../data/parodyAccounts';
import { GameState } from '../../types/game';
import { Tweet, TwitterAccount } from '../../types/social';
import { EventImportance, WorldEvent } from '../events/types';

const MAX_TWEETS = 300;

export function buildUserTwitterHandle(state: GameState): string {
  if (state.careerType === 'PLAYER' && state.playerCareer?.ign) {
    return `@${state.playerCareer.ign.replace(/[^a-zA-Z0-9_]/g, '')}`;
  }
  const clean = `${state.character.firstName}${state.character.lastName}`.replace(/[^a-zA-Z0-9]/g, '');
  return `@${clean || 'ManagerGG'}`;
}

export function buildInitialTwitterAccounts(state: GameState): TwitterAccount[] {
  const accounts: TwitterAccount[] = [];

  // User Personal Account
  accounts.push({
    id: 'user_self',
    handle: buildUserTwitterHandle(state),
    displayName:
      state.careerType === 'PLAYER' && state.playerCareer
        ? state.playerCareer.ign
        : `${state.character.firstName} ${state.character.lastName}`,
    category: 'USER',
    bio:
      state.careerType === 'PLAYER'
        ? `Competitive ${state.playerCareer?.preferredRole ?? 'Player'} · Chasing the Championship Stage`
        : `Esports Executive & Founder · Building from the ground up`,
    avatarColor: '#2563EB',
    verified: state.character.reputation >= 45 || state.org.reputation >= 45,
    followers: 120 + state.character.connections * 18,
    following: true,
  });

  // Player's Org Official Account (if founded)
  if (state.org.founded) {
    accounts.push({
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
    });
  }

  // Rival Official Organisation Accounts
  state.rivals.forEach((r) => {
    accounts.push({
      id: `org_${r.id}`,
      handle: `@${r.tag}Esports`,
      displayName: r.name,
      category: 'ORG',
      bio: r.identity,
      avatarColor: r.color,
      verified: true,
      followers: Math.round(r.fanbase * 0.65),
      following: r.reputation >= 82,
      orgId: r.id,
    });
  });

  // Media Accounts (EsportsAmaze, CheemsBond, LetsNeverGrowEsports)
  MEDIA_TWITTER_ACCOUNTS.forEach((m) => accounts.push({ ...m }));

  // Six Parody / Community Accounts
  PARODY_ACCOUNTS.forEach((p) => {
    const { stance: _stance, ...rest } = p;
    accounts.push({ ...rest });
  });

  // Pro Player & Fictional Talent Accounts
  const seenPlayerIds = new Set<string>();
  const addPlayerAccount = (p: {
    id: string;
    ign: string;
    role: string;
    overall: number;
    popularity?: number;
    attributes: { reputation: number };
    orgId: string | null;
  }) => {
    if (seenPlayerIds.has(p.id)) return;
    seenPlayerIds.add(p.id);
    const baseFollowers = Math.round(
      1800 + (p.popularity ?? p.attributes.reputation) * 1400 + p.overall * 45
    );
    accounts.push({
      id: `plr_tw_${p.id}`,
      handle: `@${p.ign.replace(/[^a-zA-Z0-9_]/g, '')}`,
      displayName: p.ign,
      category: 'PLAYER',
      bio: `Competitive ${p.role} · Overall ${p.overall}`,
      avatarColor: '#6366F1',
      verified: p.attributes.reputation >= 55 || (p.popularity ?? 0) >= 65,
      followers: baseFollowers,
      following: Boolean(p.orgId === 'player_org' || (p.popularity ?? 0) >= 60),
      playerId: p.id,
      orgId: p.orgId ?? undefined,
    });
  };

  state.roster.forEach(addPlayerAccount);
  state.marketPlayers
    .filter((p) => p.isFictionalLegend || p.attributes.reputation >= 60)
    .slice(0, 12)
    .forEach(addPlayerAccount);

  return accounts;
}

function importanceMultiplier(imp: EventImportance): number {
  if (imp === 'HIGH') return 2.4;
  if (imp === 'MEDIUM') return 1.45;
  return 0.85;
}

function computeEngagement(
  importance: EventImportance,
  followers: number,
  relevance: number,
  rng: () => number
): { likes: number; reposts: number; repliesCount: number; views: number; engagementScore: number } {
  const imp = importanceMultiplier(importance);
  const pop = Math.max(0.4, Math.min(8, Math.log10(Math.max(100, followers)) * 1.15));
  const variation = 0.72 + rng() * 0.65;
  const rawScore = imp * pop * relevance * variation * 120;
  const engagementScore = Math.min(250000, Math.max(18, Math.round(rawScore)));
  const likes = Math.round(engagementScore * (0.68 + rng() * 0.25));
  const reposts = Math.round(likes * (0.14 + rng() * 0.14));
  const repliesCount = Math.round(likes * (0.06 + rng() * 0.08));
  const views = Math.round(likes * (12 + rng() * 14));
  return { likes, reposts, repliesCount, views, engagementScore };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function createGeneratedTweet(
  account: TwitterAccount,
  content: string,
  hashtags: string[],
  event: WorldEvent,
  relevance: number,
  rng: () => number,
  idx: number
): Tweet {
  const metrics = computeEngagement(event.importance, account.followers, relevance, rng);
  return {
    id: `tw_${event.id}_${account.id}_${idx}`,
    authorId: account.id,
    authorName: account.displayName,
    authorHandle: account.handle,
    authorCategory: account.category,
    verified: account.verified,
    avatarColor: account.avatarColor,
    content,
    hashtags,
    likes: metrics.likes,
    reposts: metrics.reposts,
    repliesCount: metrics.repliesCount,
    views: metrics.views,
    engagementScore: metrics.engagementScore,
    likedByUser: false,
    repostedByUser: false,
    replies: [],
    publishedAt: event.timestamp + idx * 1000,
    gameWeek: event.gameWeek,
    gameDay: event.gameDay,
    relatedEventId: event.id,
  };
}

export function applyEventToTwitter(
  accounts: TwitterAccount[],
  existingTweets: Tweet[],
  event: WorldEvent,
  rng: () => number
): { tweets: Tweet[]; accounts: TwitterAccount[]; trendingTopics: { tag: string; postsCount: number; summary: string }[] } {
  // Prevent duplicate posts for the same event
  if (existingTweets.some((t) => t.relatedEventId === event.id)) {
    return { tweets: existingTweets, accounts, trendingTopics: computeTrendingTopics(existingTweets) };
  }

  const p = event.payload;
  const generated: Tweet[] = [];
  const teamName = String(p.teamName ?? p.orgName ?? 'the squad');
  const oppName = String(p.opponentName ?? 'opponents');
  const scoreLine = String(p.scoreLine ?? '2–1');
  const mvpIgn = String(p.mvpIgn ?? p.playerIgn ?? '');
  const tournamentName = String(p.tournamentName ?? 'the tournament');
  const playerIgn = String(p.playerIgn ?? mvpIgn ?? 'the rising star');
  const gameName = String(p.gameName ?? 'Esports');
  const tagSlug = `#${teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'Esports'}`;

  const findAcc = (id: string) => accounts.find((a) => a.id === id);

  if (event.type === 'MATCH_COMPLETED' || event.type === 'TOURNAMENT_COMPLETED') {
    const won = event.type === 'TOURNAMENT_COMPLETED' ? p.won !== false : Boolean(p.won);
    const isChamp = event.type === 'TOURNAMENT_COMPLETED' && won;

    // 1. Winner / Actor Org post
    const actorOrgAcc =
      accounts.find((a) => a.orgId && (a.orgId === event.actorId || a.displayName === teamName)) ??
      findAcc('org_player_org');
    if (actorOrgAcc) {
      const winnerLines = isChamp
        ? [
            `CHAMPIONS! ${teamName} defeat ${oppName} (${scoreLine}) to lift the ${tournamentName} trophy!`,
            `THE TROPHY IS OURS! Incredible run through ${tournamentName} capped with a ${scoreLine} victory over ${oppName}.`,
          ]
        : won
        ? [
            `WHAT A SERIES! ${teamName} take down ${oppName} (${scoreLine}) in ${tournamentName}!`,
            `Locked in and moving on. ${teamName} beat ${oppName} ${scoreLine} behind ${mvpIgn}'s standout series.`,
          ]
        : [
            `Tough ${scoreLine} loss against ${oppName} in ${tournamentName}. Back to the server—we'll return stronger.`,
            `Fell short today vs ${oppName} (${scoreLine}). Respect to our fans for staying loud all series.`,
          ];
      generated.push(
        createGeneratedTweet(
          actorOrgAcc,
          pick(winnerLines, rng),
          [tagSlug, '#Championship'],
          event,
          1.4,
          rng,
          generated.length
        )
      );
    }

    // 2. Opponent Org post
    const oppOrgAcc = accounts.find(
      (a) => a.orgId && (a.orgId === event.targetId || a.displayName === oppName)
    );
    if (oppOrgAcc) {
      const oppLine = won
        ? `GGs to ${teamName} (${scoreLine}). Mistakes hurt us late in the series—regrouping immediately.`
        : `HUGE WIN! ${oppName} close out ${teamName} ${scoreLine} in ${tournamentName}!`;
      generated.push(
        createGeneratedTweet(oppOrgAcc, oppLine, ['#GGs'], event, 1.2, rng, generated.length)
      );
    }

    // 3. Media outlets
    const amaze = findAcc('media_esports_amaze');
    if (amaze) {
      generated.push(
        createGeneratedTweet(
          amaze,
          isChamp
            ? `OFFICIAL: ${teamName} capture ${tournamentName}, defeating ${oppName} (${scoreLine}). MVP: ${mvpIgn || teamName}.`
            : `${won ? teamName : oppName} prevail ${scoreLine} against ${won ? oppName : teamName} in ${tournamentName}.`,
          ['#EsportsNews', tagSlug],
          event,
          1.35,
          rng,
          generated.length
        )
      );
    }

    const cheems = findAcc('media_cheems_bond');
    if (cheems) {
      generated.push(
        createGeneratedTweet(
          cheems,
          won
            ? `${teamName} saw ${oppName} across the stage and said "wrap it up ${scoreLine}" 💀`
            : `Somebody check on ${teamName} fans after that ${scoreLine} series 😭`,
          ['#EsportsMemes'],
          event,
          1.25,
          rng,
          generated.length
        )
      );
    }

    const lets = findAcc('media_lets_never_grow');
    if (lets && (isChamp || rng() < 0.7)) {
      generated.push(
        createGeneratedTweet(
          lets,
          won
            ? `Credit where it's due: ${teamName} prepared better than ${oppName} today. Management finally got the gameplan right.`
            : `${teamName} fans deserve honest answers after dropping ${scoreLine} to ${oppName}.`,
          ['#EsportsTalk'],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }

    // 4. Parody reactions (budget: 4-6 on matches/tournaments)
    const craven = findAcc('parody_craven');
    if (craven) {
      generated.push(
        createGeneratedTweet(
          craven,
          won
            ? `Another day, another roster getting exposed by ${teamName}. ${oppName} looked lost on late rotations.`
            : `${teamName} got completely out-called (${scoreLine}). Stop protecting underperforming rosters.`,
          [tagSlug],
          event,
          1.3,
          rng,
          generated.length
        )
      );
    }

    const para = findAcc('parody_parapandiculer');
    if (para) {
      generated.push(
        createGeneratedTweet(
          para,
          `That final map in ${teamName} vs ${oppName} (${scoreLine}) needs to be investigated immediately.`,
          ['#ReplayCheck'],
          event,
          1.2,
          rng,
          generated.length
        )
      );
    }

    const raze = findAcc('parody_razeog');
    if (raze) {
      generated.push(
        createGeneratedTweet(
          raze,
          won
            ? `People are overreacting. ${oppName} had bright spots, ${teamName} just had the sharper mid-round calls (${scoreLine}).`
            : `One ${scoreLine} defeat in ${tournamentName} doesn't erase ${teamName}'s fundamentals. Relax.`,
          [tagSlug],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }

    const sou = findAcc('parody_soulameerbhai');
    if (sou) {
      generated.push(
        createGeneratedTweet(
          sou,
          won
            ? `STILL STANDING BEHIND THE BOYS! ${teamName} ${scoreLine} LET'S GOOOO!`
            : `Tough ${scoreLine} pill to swallow, still backing ${teamName} every single week. We go again!`,
          [tagSlug],
          event,
          1.1,
          rng,
          generated.length
        )
      );
    }

    if (event.importance === 'HIGH') {
      const aryan = findAcc('parody_aryansingh');
      if (aryan) {
        generated.push(
          createGeneratedTweet(
            aryan,
            `${mvpIgn || teamName} just raised their market value by 20% in ${tournamentName}. Mark my words.`,
            [tagSlug, '#MVP'],
            event,
            1.2,
            rng,
            generated.length
          )
        );
      }
    }
  } else if (event.type === 'PLAYER_SIGNED' || event.type === 'PLAYER_TRANSFERRED') {
    const orgAcc = accounts.find((a) => a.orgId === event.actorId || a.displayName === teamName);
    if (orgAcc) {
      generated.push(
        createGeneratedTweet(
          orgAcc,
          `OFFICIAL WELCOME: ${playerIgn} joins ${teamName} for our ${gameName} division!`,
          [tagSlug, '#RosterMove'],
          event,
          1.35,
          rng,
          generated.length
        )
      );
    }

    const amaze = findAcc('media_esports_amaze');
    if (amaze) {
      generated.push(
        createGeneratedTweet(
          amaze,
          `TRANSFER WIRE: ${teamName} finalize deal to sign ${playerIgn} ahead of upcoming ${gameName} competition.`,
          ['#TransferNews', tagSlug],
          event,
          1.3,
          rng,
          generated.length
        )
      );
    }

    const cheems = findAcc('media_cheems_bond');
    if (cheems) {
      generated.push(
        createGeneratedTweet(
          cheems,
          `${playerIgn} signing with ${teamName} before we even finished updating our roster graphics 😭`,
          ['#RosterMania'],
          event,
          1.2,
          rng,
          generated.length
        )
      );
    }

    const sercular = findAcc('parody_sercular');
    if (sercular) {
      generated.push(
        createGeneratedTweet(
          sercular,
          `Everyone praising ${teamName} for grabbing ${playerIgn}—let's see if the chemistry actually works on stage.`,
          [tagSlug],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }

    const aryan = findAcc('parody_aryansingh');
    if (aryan) {
      generated.push(
        createGeneratedTweet(
          aryan,
          `${playerIgn} + ${teamName} is either a dynasty move or pure chaos. Either way, I'm tuned in.`,
          ['#Esports'],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }
  } else if (event.type === 'PLAYER_BENCHED' || event.type === 'PLAYER_RELEASED') {
    const amaze = findAcc('media_esports_amaze');
    if (amaze) {
      generated.push(
        createGeneratedTweet(
          amaze,
          `ROSTER UPDATE: ${playerIgn} moves ${event.type === 'PLAYER_BENCHED' ? 'to the bench at' : 'into free agency from'} ${teamName}.`,
          ['#RosterUpdate', tagSlug],
          event,
          1.2,
          rng,
          generated.length
        )
      );
    }
    const craven = findAcc('parody_craven');
    if (craven) {
      generated.push(
        createGeneratedTweet(
          craven,
          `${teamName} finally made the call on ${playerIgn}. Management waited two weeks too long.`,
          [tagSlug],
          event,
          1.1,
          rng,
          generated.length
        )
      );
    }
    const lets = findAcc('media_lets_never_grow');
    if (lets) {
      generated.push(
        createGeneratedTweet(
          lets,
          `Is ${teamName} scrambling without a clear long-term plan after shuffling ${playerIgn}?`,
          ['#RosterDrama'],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }
  } else if (event.type === 'SPONSORSHIP_SIGNED') {
    const brand = String(p.brandName ?? 'Global Partner');
    const orgAcc = accounts.find((a) => a.orgId === event.actorId || a.displayName === teamName);
    if (orgAcc) {
      generated.push(
        createGeneratedTweet(
          orgAcc,
          `Proud to partner with ${brand} as an official partner of ${teamName}!`,
          [tagSlug, '#Partnership'],
          event,
          1.25,
          rng,
          generated.length
        )
      );
    }
    const aryan = findAcc('parody_aryansingh');
    if (aryan) {
      generated.push(
        createGeneratedTweet(
          aryan,
          `${teamName} securing ${brand} is massive business. Commercial growth wins long-term titles.`,
          ['#EsportsBusiness'],
          event,
          1.05,
          rng,
          generated.length
        )
      );
    }
  } else if (event.type === 'CONTROVERSY_CREATED' || event.type === 'ORGANISATION_BANKRUPTCY') {
    const lets = findAcc('media_lets_never_grow');
    if (lets) {
      generated.push(
        createGeneratedTweet(
          lets,
          `DEVELOPING: ${event.description}`,
          ['#Breaking', tagSlug],
          event,
          1.45,
          rng,
          generated.length
        )
      );
    }
    const sercular = findAcc('parody_sercular');
    if (sercular) {
      generated.push(
        createGeneratedTweet(
          sercular,
          `Nobody inside the scene is surprised by this ${teamName} situation. The warning signs were everywhere.`,
          [tagSlug],
          event,
          1.35,
          rng,
          generated.length
        )
      );
    }
    const para = findAcc('parody_parapandiculer');
    if (para) {
      generated.push(
        createGeneratedTweet(
          para,
          `Esports Twitter eating good tonight. ${event.title}`,
          ['#EsportsDrama'],
          event,
          1.2,
          rng,
          generated.length
        )
      );
    }
  } else if (event.type === 'PLAYER_TRENDING' || event.type === 'ORGANISATION_TRENDING' || event.type === 'ORGANISATION_CREATED') {
    const amaze = findAcc('media_esports_amaze');
    if (amaze) {
      generated.push(
        createGeneratedTweet(
          amaze,
          `${event.title} — ${event.description}`,
          [tagSlug, '#Trending'],
          event,
          1.15,
          rng,
          generated.length
        )
      );
    }
    const sou = findAcc('parody_soulameerbhai');
    if (sou) {
      generated.push(
        createGeneratedTweet(
          sou,
          `Everyone talking about ${event.type === 'PLAYER_TRENDING' ? playerIgn : teamName} right now and rightfully so!`,
          [tagSlug],
          event,
          1.1,
          rng,
          generated.length
        )
      );
    }
  }

  // Cap daily generation per event cleanly (max 12)
  const cappedNew = generated.slice(0, 12);
  const mergedTweets = [...cappedNew, ...existingTweets].slice(0, MAX_TWEETS);

  // Bounded follower growth for participating org/user accounts on positive events
  const updatedAccounts = accounts.map((acc) => {
    if (acc.id === 'user_self' && (event.actorId === 'player_org' || event.actorId === 'user_player')) {
      const gain = event.importance === 'HIGH' ? 180 : 45;
      return { ...acc, followers: acc.followers + gain };
    }
    return acc;
  });

  return {
    tweets: mergedTweets,
    accounts: updatedAccounts,
    trendingTopics: computeTrendingTopics(mergedTweets),
  };
}

export function computeTrendingTopics(
  tweets: Tweet[]
): { tag: string; postsCount: number; summary: string }[] {
  const counts = new Map<string, { count: number; sample: string }>();
  tweets.slice(0, 80).forEach((tw) => {
    tw.hashtags.forEach((tag) => {
      const clean = tag.startsWith('#') ? tag : `#${tag}`;
      const prev = counts.get(clean);
      counts.set(clean, {
        count: (prev?.count ?? 0) + 1,
        sample: prev?.sample ?? tw.content.slice(0, 72),
      });
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([tag, info]) => ({
      tag,
      postsCount: info.count,
      summary: info.sample,
    }));
}

export function publishUserTweet(state: GameState, content: string): GameState {
  if (!state.phoneState || !content.trim()) return state;
  const userAcc =
    state.phoneState.twitterAccounts.find((a) => a.id === 'user_self') ??
    state.phoneState.twitterAccounts[0];
  if (!userAcc) return state;

  const matches = content.match(/#[a-zA-Z0-9_]+/g) ?? ['#Esports'];
  const repFactor = Math.max(1, state.character.reputation + (state.playerCareer?.attributes.popularity ?? 0));
  const likes = Math.min(25000, Math.round((userAcc.followers * 0.04 + repFactor * 3) * (0.85 + Math.random() * 0.4)));
  const newTweet: Tweet = {
    id: `tw_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorId: userAcc.id,
    authorName: userAcc.displayName,
    authorHandle: userAcc.handle,
    authorCategory: 'USER',
    verified: userAcc.verified,
    avatarColor: userAcc.avatarColor,
    content: content.trim().slice(0, 280),
    hashtags: matches,
    likes,
    reposts: Math.round(likes * 0.16),
    repliesCount: Math.round(likes * 0.08),
    views: Math.round(likes * 16),
    engagementScore: likes * 2,
    likedByUser: false,
    repostedByUser: false,
    replies: [],
    publishedAt: Date.now(),
    gameWeek: state.week,
    gameDay: state.day ?? 1,
  };

  // Bounded small follower gain from posting
  const followerDelta = Math.min(250, Math.max(4, Math.round(12 + repFactor * 0.6)));
  const updatedAccounts = state.phoneState.twitterAccounts.map((a) =>
    a.id === userAcc.id ? { ...a, followers: a.followers + followerDelta } : a
  );
  const updatedTweets = [newTweet, ...state.phoneState.tweets].slice(0, MAX_TWEETS);

  return {
    ...state,
    character: {
      ...state.character,
      reputation: Math.min(100, state.character.reputation + (state.character.reputation < 25 ? 1 : 0)),
    },
    playerCareer: state.playerCareer
      ? {
          ...state.playerCareer,
          attributes: {
            ...state.playerCareer.attributes,
            popularity: Math.min(100, state.playerCareer.attributes.popularity + 1),
          },
        }
      : undefined,
    phoneState: {
      ...state.phoneState,
      twitterAccounts: updatedAccounts,
      tweets: updatedTweets,
      trendingTopics: computeTrendingTopics(updatedTweets),
    },
  };
}

export function toggleLikeTweet(state: GameState, tweetId: string): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      tweets: state.phoneState.tweets.map((t) =>
        t.id === tweetId
          ? {
              ...t,
              likedByUser: !t.likedByUser,
              likes: t.likedByUser ? Math.max(0, t.likes - 1) : t.likes + 1,
            }
          : t
      ),
    },
  };
}

export function toggleRepostTweet(state: GameState, tweetId: string): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      tweets: state.phoneState.tweets.map((t) =>
        t.id === tweetId
          ? {
              ...t,
              repostedByUser: !t.repostedByUser,
              reposts: t.repostedByUser ? Math.max(0, t.reposts - 1) : t.reposts + 1,
            }
          : t
      ),
    },
  };
}

export function replyToTweet(state: GameState, tweetId: string, replyText: string): GameState {
  if (!state.phoneState || !replyText.trim()) return state;
  const userAcc = state.phoneState.twitterAccounts.find((a) => a.id === 'user_self');
  if (!userAcc) return state;

  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      tweets: state.phoneState.tweets.map((t) =>
        t.id === tweetId
          ? {
              ...t,
              repliesCount: t.repliesCount + 1,
              replies: [
                ...t.replies,
                {
                  id: `rep_${Date.now()}`,
                  authorId: userAcc.id,
                  authorName: userAcc.displayName,
                  authorHandle: userAcc.handle,
                  content: replyText.trim().slice(0, 220),
                  likes: 1,
                  publishedAt: Date.now(),
                  gameWeek: state.week,
                },
              ],
            }
          : t
      ),
    },
  };
}

export function toggleFollowTwitterAccount(state: GameState, accountId: string): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      twitterAccounts: state.phoneState.twitterAccounts.map((a) =>
        a.id === accountId ? { ...a, following: !a.following } : a
      ),
    },
  };
}
