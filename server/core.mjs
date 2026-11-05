import { fetchEspnNbaScoreboard, fetchEspnNflScoreboard, fetchNbaGames, fetchNflGames } from './balldontlie.mjs';
import { fetchTeamNews } from './news.mjs';
import { fetchUnifiedBoxScore } from './boxscore.mjs';
import { fetchUnifiedStandings } from './standings.mjs';
import { transformEspnEvents, transformNbaGames, transformNflGames } from './transformers.mjs';

const cachedMatchesByLeague = new Map();

function buildLastUpdated() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function dedupeMatches(matches) {
  const map = new Map();
  matches.forEach((m) => {
    const key = `${m.league}:${m.startDate?.slice(0, 10)}:${m.homeAbbr}:${m.awayAbbr}`;
    if (!map.has(key)) {
      map.set(key, m);
    }
  });
  return Array.from(map.values());
}

function retainCachedLeagueMatches(matches) {
  return ['NBA', 'NFL'].flatMap((league) => {
    const freshMatches = matches.filter((match) => match.league === league);
    const cachedMatches = cachedMatchesByLeague.get(league) ?? [];
    const stableMatches = dedupeMatches([...freshMatches, ...cachedMatches]);

    if (freshMatches.length > 0) {
      cachedMatchesByLeague.set(league, stableMatches);
    }

    return stableMatches;
  });
}

export async function buildScoreboardPayload(apiKey = process.env.BALLDONTLIE_API_KEY) {
  try {
    const tasks = [];

    // 1. NBA: ESPN + BallDontLie
    tasks.push(
      (async () => {
        const results = [];
        const espnEvents = await fetchEspnNbaScoreboard().catch(() => []);
        if (espnEvents.length > 0) {
          results.push(...transformEspnEvents(espnEvents, 'NBA'));
        }
        if (apiKey) {
          const bdlData = await fetchNbaGames(apiKey).catch(() => ({ data: [] }));
          if (bdlData.data?.length > 0) {
            results.push(...transformNbaGames(bdlData));
          }
        }
        return dedupeMatches(results);
      })(),
    );

    // 2. NFL: ESPN + BallDontLie
    tasks.push(
      (async () => {
        const results = [];
        const espnEvents = await fetchEspnNflScoreboard().catch(() => []);
        if (espnEvents.length > 0) {
          results.push(...transformEspnEvents(espnEvents, 'NFL'));
        }
        if (apiKey) {
          const bdlData = await fetchNflGames(apiKey).catch(() => ({ data: [] }));
          if (bdlData.data?.length > 0) {
            results.push(...transformNflGames(bdlData));
          }
        }
        return dedupeMatches(results);
      })(),
    );

    const settled = await Promise.allSettled(tasks);
    const freshMatches = settled.flatMap((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));
    const matches = retainCachedLeagueMatches(freshMatches);
    const hasNbaMatches = matches.some((match) => match.league === 'NBA');
    const hasNflMatches = matches.some((match) => match.league === 'NFL');
    const messageParts = [];

    if (hasNbaMatches && hasNflMatches) {
      messageParts.push('Live data is available for NBA and NFL');
    } else {
      if (hasNbaMatches) messageParts.push('NBA live data connected');
      if (hasNflMatches) messageParts.push('NFL live data connected');
    }

    return {
      statusCode: 200,
      payload: {
        matches,
        lastUpdated: buildLastUpdated(),
        source: matches.length > 0 ? 'live' : 'demo',
        message: messageParts.join(' · ') || 'No live data is available.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        matches: [],
        lastUpdated: null,
        source: 'demo',
        message: error instanceof Error ? error.message : 'An error occurred while requesting live data.',
      },
    };
  }
}

export async function buildTeamNewsPayload({ team, league = '', query = '' }) {
  if (!team) {
    return {
      statusCode: 400,
      payload: {
        articles: [],
        message: 'The team parameter is required.',
      },
    };
  }

  try {
    const articles = await fetchTeamNews(team, league, query);
    return {
      statusCode: 200,
      payload: {
        articles,
        message: articles.length > 0 ? 'Team news loaded.' : 'No news is available.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        articles: [],
        message: error instanceof Error ? error.message : 'An error occurred while loading news.',
      },
    };
  }
}

export async function buildBoxScorePayload({
  league = 'NBA',
  gameId = '',
  seasonId = '',
  seriesId = '0',
  gameDate = '',
  homeTeam = '',
  awayTeam = '',
  homeAbbr = '',
  awayAbbr = '',
}) {
  try {
    const boxScore = await fetchUnifiedBoxScore({
      league,
      gameId,
      seasonId,
      seriesId,
      gameDate,
      homeTeam,
      awayTeam,
      homeAbbr,
      awayAbbr,
    });

    return {
      statusCode: 200,
      payload: {
        boxScore,
        message: boxScore ? `${league} box score loaded.` : `No ${league} box score is available.`,
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        boxScore: null,
        message: error instanceof Error ? error.message : `An error occurred while loading the ${league} box score.`,
      },
    };
  }
}

export async function buildStandingsPayload({ league = 'ALL' } = {}) {
  try {
    const standings = await fetchUnifiedStandings(league);
    return {
      statusCode: 200,
      payload: {
        standings,
        message: 'Standings loaded.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        standings: null,
        message: error instanceof Error ? error.message : 'An error occurred while loading standings.',
      },
    };
  }
}
