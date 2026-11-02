import { fetchEspnNbaScoreboard, fetchEspnNflScoreboard, fetchNbaGames, fetchNflGames } from './balldontlie.mjs';
import { fetchKboBoxScore, fetchKboScoreboard } from './kbo.mjs';
import { fetchTeamNews } from './news.mjs';
import { fetchUnifiedBoxScore } from './boxscore.mjs';
import { fetchUnifiedStandings } from './standings.mjs';
import { transformEspnEvents, transformNbaGames, transformNflGames } from './transformers.mjs';

function buildLastUpdated() {
  return new Intl.DateTimeFormat('ko-KR', {
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

    return {
      statusCode: 200,
      payload: {
        matches,
        lastUpdated: buildLastUpdated(),
        source: matches.length > 0 ? 'live' : 'demo',
        message: messageParts.join(' · ') || '표시할 실시간 데이터가 없습니다.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        matches: [],
        lastUpdated: null,
        source: 'demo',
        message: error instanceof Error ? error.message : '실데이터 요청 중 오류가 발생했습니다.',
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
        message: 'team 파라미터가 필요합니다.',
      },
    };
  }

  try {
    const articles = await fetchTeamNews(team, league, query);
    return {
      statusCode: 200,
      payload: {
        articles,
        message: articles.length > 0 ? '팀 뉴스 기사를 불러왔습니다.' : '표시할 뉴스가 없습니다.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        articles: [],
        message: error instanceof Error ? error.message : '뉴스 요청 중 오류가 발생했습니다.',
      },
    };
  }
}

export async function buildBoxScorePayload({
  league = 'KBO',
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
        message: boxScore ? `${league} 세부 기록을 불러왔습니다.` : `표시할 ${league} 세부 기록이 없습니다.`,
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        boxScore: null,
        message: error instanceof Error ? error.message : `${league} 세부 기록 요청 중 오류가 발생했습니다.`,
      },
    };
  }
}

export async function buildKboBoxScorePayload({ gameId, seasonId = '', seriesId = '0', gameDate = '' }) {
  if (!gameId) {
    return {
      statusCode: 400,
      payload: {
        boxScore: null,
        message: 'gameId 파라미터가 필요합니다.',
      },
    };
  }

  try {
    const boxScore = await fetchKboBoxScore({
      gameId,
      seasonId,
      seriesId,
      gameDate,
    });

    return {
      statusCode: 200,
      payload: {
        boxScore,
        message: boxScore ? 'KBO 박스스코어를 불러왔습니다.' : '표시할 KBO 박스스코어가 없습니다.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        boxScore: null,
        message: error instanceof Error ? error.message : 'KBO 박스스코어 요청 중 오류가 발생했습니다.',
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
        message: '순위표 데이터를 성공적으로 불러왔습니다.',
      },
    };
  } catch (error) {
    return {
      statusCode: 502,
      payload: {
        standings: null,
        message: error instanceof Error ? error.message : '순위표 데이터를 불러오는 중 오류가 발생했습니다.',
      },
    };
  }
}
