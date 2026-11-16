import { NEWS_OUTLETS } from '../../data/mediaOutlets';
import { NewsArticle, NewsCategory } from '../../types/social';
import { WorldEvent } from '../events/types';

const MAX_ARTICLES = 150;

export function createInitialNewsArticles(week = 1): NewsArticle[] {
  return [
    {
      id: 'news_art_init_1',
      publisherId: 'esports_amaze',
      publisherName: 'EsportsAmaze',
      headline: 'Global Esports Franchises Gear Up for Landmark Season',
      summary: 'Titan Esports, Nova Gaming, and Iron Legion headline opening power rankings across 11 major titles.',
      body: 'Analysts expect intense competition across regional splits and international majors this year as independent talents Kiwyos YT, Sparky, and Adi Gamer draw early scouting buzz.',
      category: 'Breaking News',
      relatedEventId: 'init_season',
      publishedAt: Date.now() - 86400000,
      gameWeek: week,
      importance: 80,
    },
    {
      id: 'news_art_init_2',
      publisherId: 'cheems_bond',
      publisherName: 'CheemsBond',
      headline: 'Every Org Claiming "This Is Our Year" Before Week 1 Even Starts',
      summary: 'Social feeds already overheating before the first LAN map goes live.',
      body: 'Fans have already crowned three different champions based entirely on scrim rumors. Good luck surviving Week 2 without a roster panic.',
      category: 'Community Discussions',
      relatedEventId: 'init_memes',
      publishedAt: Date.now() - 43200000,
      gameWeek: week,
      importance: 60,
    },
    {
      id: 'news_art_init_3',
      publisherId: 'lets_never_grow',
      publisherName: 'LetsNeverGrowEsports',
      headline: 'Can Emerging Regional Rosters Break the Big-Org Monopoly?',
      summary: 'Salary inflation and facility arms races test smaller squads.',
      body: 'As legacy powerhouses pour millions into multi-title operations, grassroots squads and amateur prodigies face steeper barriers to reaching the Major stage.',
      category: 'Player Profiles',
      relatedEventId: 'init_commentary',
      publishedAt: Date.now() - 21600000,
      gameWeek: week,
      importance: 70,
    },
  ];
}

export function applyEventToNews(
  existing: NewsArticle[],
  event: WorldEvent,
  rng: () => number
): NewsArticle[] {
  if (existing.some((a) => a.relatedEventId === event.id)) {
    return existing;
  }

  // Generate articles only for notable events
  if (event.importance === 'LOW' && rng() > 0.35) {
    return existing;
  }

  const p = event.payload;
  const teamName = String(p.teamName ?? p.orgName ?? 'the club');
  const oppName = String(p.opponentName ?? 'rivals');
  const playerIgn = String(p.playerIgn ?? p.mvpIgn ?? 'Star Player');
  const scoreLine = String(p.scoreLine ?? '2–1');
  const tournamentName = String(p.tournamentName ?? 'Tournament');
  const brand = String(p.brandName ?? 'Sponsor');
  const gameName = String(p.gameName ?? 'Esports');
  const won = Boolean(p.won);

  const created: NewsArticle[] = [];
  const impScore = event.importance === 'HIGH' ? 92 : event.importance === 'MEDIUM' ? 74 : 52;

  const pushArticle = (
    outletId: 'esports_amaze' | 'cheems_bond' | 'lets_never_grow',
    category: NewsCategory,
    headline: string,
    summary: string,
    body: string
  ) => {
    const outlet = NEWS_OUTLETS.find((o) => o.id === outletId)!;
    created.push({
      id: `art_${event.id}_${outletId}`,
      publisherId: outlet.id,
      publisherName: outlet.name,
      headline,
      summary,
      body,
      category,
      relatedEventId: event.id,
      publishedAt: event.timestamp + created.length * 1500,
      gameWeek: event.gameWeek,
      importance: impScore,
    });
  };

  if (event.type === 'TOURNAMENT_COMPLETED') {
    const champion = won ? teamName : oppName;
    const runnerUp = won ? oppName : teamName;
    pushArticle(
      'esports_amaze',
      'Tournament Results',
      `${champion} Crowned ${tournamentName} Champions Over ${runnerUp}`,
      `${champion} closed out the final ${scoreLine} to claim the ${tournamentName} title.`,
      `In a decisive ${scoreLine} championship series, ${champion} outlasted ${runnerUp} in ${gameName}. Standout performances from ${playerIgn} anchored the trophy run.`
    );
    pushArticle(
      'cheems_bond',
      'Community Discussions',
      `${runnerUp} Fans Typing "Wait Until Next Split" After ${scoreLine} Final`,
      `${champion} lifted the trophy while Twitter immediately hit panic mode.`,
      `Another grand finals, another meltdown in the replies. ${champion} took care of business ${scoreLine} and left ${runnerUp} holding the replay tape.`
    );
    if (event.importance === 'HIGH') {
      pushArticle(
        'lets_never_grow',
        'Organisation News',
        `What ${champion}'s ${tournamentName} Triumph Signals for Global Rankings`,
        `Tactical discipline and roster stability paid off on the biggest stage.`,
        `While rival clubs churned lineups all month, ${champion} proved cohesive preparation still wins championships (${scoreLine} vs ${runnerUp}).`
      );
    }
  } else if (event.type === 'MATCH_COMPLETED') {
    const winner = won ? teamName : oppName;
    const loser = won ? oppName : teamName;
    pushArticle(
      'esports_amaze',
      'Tournament Results',
      `${winner} Defeat ${loser} (${scoreLine}) in ${tournamentName}`,
      `${playerIgn} delivered a pivotal display to swing the bracket match.`,
      `${winner} secured a ${scoreLine} victory over ${loser} during ${tournamentName} action. ${playerIgn} paced the server when late-game execution mattered most.`
    );
    if (event.importance === 'HIGH' || rng() < 0.5) {
      pushArticle(
        'cheems_bond',
        'Community Discussions',
        `Live Look at ${loser} After Dropping ${scoreLine} to ${winner}`,
        `The post-match thread is already moving faster than the match itself.`,
        `${winner} handled ${loser} ${scoreLine} and community accounts wasted zero seconds dissecting every misplay.`
      );
    }
  } else if (event.type === 'PLAYER_SIGNED' || event.type === 'PLAYER_TRANSFERRED') {
    pushArticle(
      'esports_amaze',
      'Transfer News',
      `Major Roster Move: ${teamName} Sign ${playerIgn} for ${gameName}`,
      `Confirmed acquisition bolsters ${teamName}'s competitive lineup.`,
      `${teamName} have officially completed the signing of ${playerIgn}. The move reshapes expectations heading into upcoming ${gameName} events.`
    );
    pushArticle(
      'cheems_bond',
      'Transfer News',
      `${playerIgn} Changed Jerseys Before Fans Could Update Their Wallpapers`,
      `Another week, another headline roster shake-up at ${teamName}.`,
      `Contract ink barely dried before social feeds debated whether ${playerIgn} will carry ${teamName} straight to the finals.`
    );
  } else if (event.type === 'PLAYER_BENCHED' || event.type === 'PLAYER_RELEASED') {
    pushArticle(
      'esports_amaze',
      'Transfer News',
      `${teamName} Shake Up ${gameName} Lineup as ${playerIgn} Steps Back`,
      `Management opts for a tactical reset mid-season.`,
      `${event.description} Observers are watching closely to see where ${playerIgn} lands next.`
    );
    pushArticle(
      'lets_never_grow',
      'Controversies',
      `Is Moving On From ${playerIgn} the Beginning of Deeper Trouble at ${teamName}?`,
      `Critics question roster patience and leadership decisions.`,
      `Replacing ${playerIgn} raises sharp questions about whether ${teamName}'s issues stem from player form or front-office strategy.`
    );
  } else if (event.type === 'SPONSORSHIP_SIGNED') {
    pushArticle(
      'esports_amaze',
      'Financial Reports',
      `${teamName} Ink Commercial Partnership With ${brand}`,
      `New deal strengthens club revenue and commercial footprint.`,
      `${teamName} announced a new partnership with ${brand}, adding recurring sponsorship revenue and reinforcing investor confidence.`
    );
  } else if (event.type === 'CONTROVERSY_CREATED' || event.type === 'ORGANISATION_BANKRUPTCY') {
    pushArticle(
      'esports_amaze',
      'Breaking News',
      event.title,
      event.description,
      `Industry stakeholders reacted swiftly today following news regarding ${teamName}: ${event.description}`
    );
    pushArticle(
      'lets_never_grow',
      'Controversies',
      `Hard Questions After ${event.title}`,
      `Financial oversight and management accountability return to center stage.`,
      `${event.description} Community voices are demanding greater transparency across franchise governance.`
    );
  } else if (event.type === 'ORGANISATION_CREATED' || event.type === 'PLAYER_RETIREMENT') {
    pushArticle(
      'esports_amaze',
      'Organisation News',
      event.title,
      event.description,
      event.description
    );
  } else if (event.type === 'PLAYER_TRENDING') {
    pushArticle(
      'esports_amaze',
      'Player Profiles',
      `Spotlight: ${playerIgn} Surges in Global Fan Attention`,
      event.description,
      `${playerIgn} has become one of the fastest-rising names across competitive rankings and creator platforms.`
    );
  }

  return [...created.slice(0, 3), ...existing].slice(0, MAX_ARTICLES);
}
