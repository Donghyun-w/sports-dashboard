import { createServer } from 'node:http';
import { fetchEspnNbaScoreboard, fetchEspnNflScoreboard, fetchNbaGames, fetchNflGames } from './balldontlie.mjs';
import { fetchKboBoxScore, fetchKboScoreboard } from './kbo.mjs';
import { fetchTeamNews } from './news.mjs';
import { transformEspnEvents, transformNbaGames, transformNflGames } from './transformers.mjs';

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const PORT = Number(process.env.PORT || 8787);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
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

    // 3. KBO: Official Scraper
    tasks.push(
      fetchKboScoreboard().catch((error) => {
        console.error('KBO fetch error:', error?.message || error);
        return [];
      }),
    );

    const settled = await Promise.allSettled(tasks);
    const matches = settled.flatMap((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));
    const hasNbaMatches = matches.some((match) => match.league === 'NBA');
    const hasNflMatches = matches.some((match) => match.league === 'NFL');
    const hasKboMatches = matches.some((match) => match.league === 'KBO');
    const messageParts = [];

    if (hasNbaMatches && hasNflMatches && hasKboMatches) {
      messageParts.push('NBA · NFL · KBO 전 리그 실시간 데이터 수신 중');
    } else {
      if (hasNbaMatches) messageParts.push('NBA 실시간 라이브 연동');
      if (hasNflMatches) messageParts.push('NFL 실시간 라이브 연동');
      if (hasKboMatches) messageParts.push('KBO 공식 스코어보드 실시간 반영');
    }

    sendJson(response, 200, {
      matches,
      lastUpdated: new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      source: matches.length > 0 ? 'live' : 'demo',
      message: messageParts.join(' · ') || '표시할 실시간 데이터가 없습니다.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '실데이터 요청 중 오류가 발생했습니다.';
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
      message: 'team 파라미터가 필요합니다.',
    });
    return;
  }

  try {
    const articles = await fetchTeamNews(team, league, query);
    sendJson(response, 200, {
      articles,
      message: articles.length > 0 ? '팀 뉴스 기사를 불러왔습니다.' : '표시할 뉴스가 없습니다.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '뉴스 요청 중 오류가 발생했습니다.';
    sendJson(response, 502, {
      articles: [],
      message,
    });
  }
}

async function handleKboBoxScore(requestUrl, response) {
  const gameId = requestUrl.searchParams.get('gameId');
  const seasonId = requestUrl.searchParams.get('seasonId') ?? '';
  const seriesId = requestUrl.searchParams.get('seriesId') ?? '0';
  const gameDate = requestUrl.searchParams.get('gameDate') ?? '';

  if (!gameId) {
    sendJson(response, 400, {
      boxScore: null,
      message: 'gameId 파라미터가 필요합니다.',
    });
    return;
  }

  try {
    const boxScore = await fetchKboBoxScore({
      gameId,
      seasonId,
      seriesId,
      gameDate,
    });

    sendJson(response, 200, {
      boxScore,
      message: boxScore ? 'KBO 박스스코어를 불러왔습니다.' : '표시할 KBO 박스스코어가 없습니다.',
    });
  } catch (error) {
    sendJson(response, 502, {
      boxScore: null,
      message: error instanceof Error ? error.message : 'KBO 박스스코어 요청 중 오류가 발생했습니다.',
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

  if (request.method === 'GET' && requestUrl.pathname === '/api/kbo-boxscore') {
    await handleKboBoxScore(requestUrl, response);
    return;
  }

  sendJson(response, 404, { message: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scoreboard API listening on http://127.0.0.1:${PORT}`);
});
