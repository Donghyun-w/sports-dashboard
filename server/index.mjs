import { createServer } from 'node:http';
import { fetchNbaGames, fetchNflGames } from './balldontlie.mjs';
import { fetchKboScoreboard } from './kbo.mjs';
import { fetchTeamNews } from './news.mjs';
import { transformNbaGames, transformNflGames } from './transformers.mjs';

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const PORT = Number(process.env.PORT || 8787);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(JSON.stringify(payload));
}

async function handleScoreboard(response) {
  try {
    const tasks = [];

    if (API_KEY) {
      tasks.push(
        Promise.all([fetchNbaGames(API_KEY), fetchNflGames(API_KEY)]).then(([nbaPayload, nflPayload]) => [
          ...transformNbaGames(nbaPayload),
          ...transformNflGames(nflPayload),
        ]),
      );
    }

    tasks.push(fetchKboScoreboard());

    const settled = await Promise.allSettled(tasks);
    const matches = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
    const hasBallDontLie = API_KEY && settled[0]?.status === 'fulfilled';
    const hasBallDontLieMatches = matches.some((match) => match.league === 'NBA' || match.league === 'NFL');
    const hasKbo = settled.some((result) => result.status === 'fulfilled' && result.value.some((match) => match.league === 'KBO'));
    const failures = settled.filter((result) => result.status === 'rejected');
    const messageParts = [];

    if (hasBallDontLieMatches) {
      messageParts.push('NBA/NFL 실데이터 연결 완료');
    } else if (hasBallDontLie) {
      messageParts.push('NBA/NFL 현재 일정 없음');
    } else if (!API_KEY) {
      messageParts.push('NBA/NFL은 API 키가 없어 데모를 사용 중');
    }

    if (hasKbo) {
      messageParts.push('KBO 공식 스코어보드 실시간 반영');
    }

    if (failures.length > 0) {
      messageParts.push('일부 소스는 일시적으로 불안정할 수 있음');
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

  sendJson(response, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Scoreboard API listening on http://localhost:${PORT}`);
});
