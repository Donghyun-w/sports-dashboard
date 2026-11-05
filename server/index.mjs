import { createServer } from 'node:http';
import { fetchEspnNbaScoreboard, fetchEspnNflScoreboard, fetchNbaGames, fetchNflGames } from './balldontlie.mjs';
import { fetchTeamNews } from './news.mjs';
import { fetchUnifiedBoxScore } from './boxscore.mjs';
import { fetchUnifiedStandings } from './standings.mjs';
import { transformEspnEvents, transformNbaGames, transformNflGames } from './transformers.mjs';

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const PORT = Number(process.env.PORT || 8787);
const cachedMatchesByLeague = new Map();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  response.end(JSON.stringify(payload));
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

async function handleScoreboard(response) {
  try {
    const tasks = [];

    // 1. NBA: ESPN Scoreboard + BallDontLie
    tasks.push(
      (async () => {
        const results = [];
        const espnEvents = await fetchEspnNbaScoreboard().catch(() => []);
        if (espnEvents.length > 0) {
          results.push(...transformEspnEvents(espnEvents, 'NBA'));
        }
        if (API_KEY) {
          const bdlData = await fetchNbaGames(API_KEY).catch(() => ({ data: [] }));
          if (bdlData.data?.length > 0) {
            results.push(...transformNbaGames(bdlData));
          }
        }
        return dedupeMatches(results);
      })(),
    );

    // 2. NFL: ESPN Scoreboard + BallDontLie
    tasks.push(
      (async () => {
        const results = [];
        const espnEvents = await fetchEspnNflScoreboard().catch(() => []);
        if (espnEvents.length > 0) {
          results.push(...transformEspnEvents(espnEvents, 'NFL'));
        }
        if (API_KEY) {
          const bdlData = await fetchNflGames(API_KEY).catch(() => ({ data: [] }));
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

    sendJson(response, 200, {
      matches,
      lastUpdated: new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      source: matches.length > 0 ? 'live' : 'demo',
      message: messageParts.join(' · ') || 'No live data is available.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred while requesting live data.';
    sendJson(response, 502, {
      matches: [],
      lastUpdated: null,
      source: 'demo',
      message,
    });
  }
}

async function handleTeamNews(requestUrl, response) {
  const team = requestUrl.searchParams.get('team');
  const league = requestUrl.searchParams.get('league') ?? '';
  const query = requestUrl.searchParams.get('query') ?? '';

  if (!team) {
    sendJson(response, 400, {
      articles: [],
      message: 'The team parameter is required.',
    });
    return;
  }

  try {
    const articles = await fetchTeamNews(team, league, query);
    sendJson(response, 200, {
      articles,
      message: articles.length > 0 ? 'Team news loaded.' : 'No news is available.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred while loading news.';
    sendJson(response, 502, {
      articles: [],
      message,
    });
  }
}

async function handleStandings(requestUrl, response) {
  const league = requestUrl.searchParams.get('league') || 'ALL';
  try {
    const standings = await fetchUnifiedStandings(league);
    sendJson(response, 200, {
      standings,
      message: 'Standings loaded.',
    });
  } catch (error) {
    sendJson(response, 502, {
      standings: null,
      message: error instanceof Error ? error.message : 'An error occurred while loading standings.',
    });
  }
}

async function handleUnifiedBoxScore(requestUrl, response) {
  const league = requestUrl.searchParams.get('league') ?? 'NBA';
  const gameId = requestUrl.searchParams.get('gameId') ?? '';
  const seasonId = requestUrl.searchParams.get('seasonId') ?? '';
  const seriesId = requestUrl.searchParams.get('seriesId') ?? '0';
  const gameDate = requestUrl.searchParams.get('gameDate') ?? '';
  const homeTeam = requestUrl.searchParams.get('homeTeam') ?? '';
  const awayTeam = requestUrl.searchParams.get('awayTeam') ?? '';
  const homeAbbr = requestUrl.searchParams.get('homeAbbr') ?? '';
  const awayAbbr = requestUrl.searchParams.get('awayAbbr') ?? '';

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

    sendJson(response, 200, {
      boxScore,
      message: boxScore ? `${league} box score loaded.` : `No ${league} box score is available.`,
    });
  } catch (error) {
    sendJson(response, 502, {
      boxScore: null,
      message: error instanceof Error ? error.message : `An error occurred while loading the ${league} box score.`,
    });
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/scoreboard') {
    await handleScoreboard(response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/team-news') {
    await handleTeamNews(requestUrl, response);
    return;
  }

  if (request.method === 'GET' && (requestUrl.pathname === '/api/boxscore' || requestUrl.pathname === '/api/unified-boxscore')) {
    await handleUnifiedBoxScore(requestUrl, response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/standings') {
    await handleStandings(requestUrl, response);
    return;
  }

  sendJson(response, 404, { message: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scoreboard API listening on http://127.0.0.1:${PORT}`);
});
